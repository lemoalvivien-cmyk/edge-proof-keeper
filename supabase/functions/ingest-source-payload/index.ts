import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface SourcePayloadItem {
  signal_type: string;
  category: string;
  title: string;
  description?: string;
  severity?: string;
  confidence_score?: number;
  evidence?: Record<string, unknown>;
  references?: string[];
  asset_id?: string | null;
  detected_at?: string;
  raw_payload?: Record<string, unknown>;
}

interface IngestPayload {
  source_id: string;
  items: SourcePayloadItem[];
}

// ─── Normalizers ──────────────────────────────────────────────────────────────

const SEVERITY_MAP: Record<string, string> = {
  critical: 'critical', crit: 'critical',
  high: 'high',
  medium: 'medium', med: 'medium', moderate: 'medium',
  low: 'low',
  info: 'info', informational: 'info', none: 'info',
};

function normalizeSeverity(input: string | undefined): string {
  if (!input) return 'info';
  return SEVERITY_MAP[input.trim().toLowerCase()] ?? 'info';
}

function sanitizeText(input: string | undefined, maxLen = 500): string {
  if (!input) return '';
  return input.trim().slice(0, maxLen).replace(/[\u0000-\u001F\u007F]/g, '');
}

function buildDedupeKey(params: {
  organizationId: string;
  sourceId: string;
  signalType: string;
  category: string;
  title: string;
  assetId?: string | null;
}): string {
  return [
    params.organizationId,
    params.sourceId,
    params.signalType.trim().toLowerCase(),
    params.category.trim().toLowerCase(),
    params.title.trim().toLowerCase().slice(0, 200),
    params.assetId ?? 'none',
  ].join(':');
}

function validateItem(item: unknown, index: number): SourcePayloadItem {
  if (!item || typeof item !== 'object') {
    throw new Error(`Item[${index}]: must be an object`);
  }
  const obj = item as Record<string, unknown>;

  if (!obj.signal_type || typeof obj.signal_type !== 'string') {
    throw new Error(`Item[${index}]: signal_type is required (string)`);
  }
  if (!obj.category || typeof obj.category !== 'string') {
    throw new Error(`Item[${index}]: category is required (string)`);
  }
  if (!obj.title || typeof obj.title !== 'string') {
    throw new Error(`Item[${index}]: title is required (string)`);
  }

  return {
    signal_type: obj.signal_type as string,
    category: obj.category as string,
    title: obj.title as string,
    description: typeof obj.description === 'string' ? obj.description : undefined,
    severity: typeof obj.severity === 'string' ? obj.severity : undefined,
    confidence_score: typeof obj.confidence_score === 'number' ? obj.confidence_score : undefined,
    evidence: obj.evidence && typeof obj.evidence === 'object' ? obj.evidence as Record<string, unknown> : undefined,
    references: Array.isArray(obj.references) ? obj.references as string[] : undefined,
    asset_id: typeof obj.asset_id === 'string' ? obj.asset_id : null,
    detected_at: typeof obj.detected_at === 'string' ? obj.detected_at : undefined,
    raw_payload: obj.raw_payload && typeof obj.raw_payload === 'object' ? obj.raw_payload as Record<string, unknown> : undefined,
  };
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  // Auth: validate JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const userToken = authHeader.replace('Bearer ', '');
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${userToken}` } },
  });

  const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(userToken);
  if (claimsError || !claimsData?.claims) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  const userId = claimsData.claims.sub;

  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  try {
    // Parse & validate body
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = body as Record<string, unknown>;
    if (!payload.source_id || typeof payload.source_id !== 'string') {
      return new Response(JSON.stringify({ error: 'source_id is required (string)' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      return new Response(JSON.stringify({ error: 'items must be a non-empty array' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (payload.items.length > 500) {
      return new Response(JSON.stringify({ error: 'Max 500 items per batch' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const input = payload as IngestPayload;

    // Verify the source belongs to an org accessible by this user
    const { data: userProfile } = await serviceClient
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!userProfile?.organization_id) {
      return new Response(JSON.stringify({ error: 'User has no organization' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const orgId = userProfile.organization_id;

    const { data: source, error: sourceError } = await serviceClient
      .from('data_sources')
      .select('id, organization_id, status, name')
      .eq('id', input.source_id)
      .eq('organization_id', orgId)
      .single();

    if (sourceError || !source) {
      return new Response(JSON.stringify({ error: 'Source not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create sync run
    const { data: syncRun, error: syncError } = await serviceClient
      .from('source_sync_runs')
      .insert({
        organization_id: orgId,
        source_id: source.id,
        status: 'running',
        items_received: input.items.length,
        items_normalized: 0,
      })
      .select('id')
      .single();

    if (syncError || !syncRun) {
      throw new Error(`Failed to create sync run: ${syncError?.message}`);
    }

    // Validate all items
    const validatedItems: SourcePayloadItem[] = [];
    const validationErrors: string[] = [];
    for (let i = 0; i < input.items.length; i++) {
      try {
        validatedItems.push(validateItem(input.items[i], i));
      } catch (err) {
        validationErrors.push((err as Error).message);
      }
    }

    if (validationErrors.length > 0 && validatedItems.length === 0) {
      await serviceClient
        .from('source_sync_runs')
        .update({ status: 'failed', error_message: validationErrors.join('; '), completed_at: new Date().toISOString() })
        .eq('id', syncRun.id);

      return new Response(JSON.stringify({ error: 'All items failed validation', details: validationErrors }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build dedupe keys for existing signals
    const dedupeKeys = validatedItems.map(item =>
      buildDedupeKey({
        organizationId: orgId,
        sourceId: source.id,
        signalType: item.signal_type,
        category: item.category,
        title: item.title,
        assetId: item.asset_id,
      })
    );

    const { data: existingSignals } = await serviceClient
      .from('signals')
      .select('dedupe_key')
      .eq('organization_id', orgId)
      .in('dedupe_key', dedupeKeys);

    const existingKeys = new Set((existingSignals ?? []).map((s: { dedupe_key: string | null }) => s.dedupe_key));

    // Prepare inserts
    const toInsert = [];
    let skippedDuplicates = 0;

    for (const item of validatedItems) {
      const dedupeKey = buildDedupeKey({
        organizationId: orgId,
        sourceId: source.id,
        signalType: item.signal_type,
        category: item.category,
        title: item.title,
        assetId: item.asset_id,
      });

      if (existingKeys.has(dedupeKey)) {
        skippedDuplicates++;
        continue;
      }

      toInsert.push({
        organization_id: orgId,
        source_id: source.id,
        asset_id: item.asset_id ?? null,
        signal_type: sanitizeText(item.signal_type, 100),
        category: sanitizeText(item.category, 100),
        title: sanitizeText(item.title, 500),
        description: sanitizeText(item.description),
        severity: normalizeSeverity(item.severity),
        confidence_score: item.confidence_score !== undefined
          ? Math.min(Math.max(Number(item.confidence_score), 0), 1)
          : null,
        evidence: item.evidence ?? {},
        signal_refs: item.references ?? [],
        detected_at: item.detected_at ?? new Date().toISOString(),
        status: 'new',
        dedupe_key: dedupeKey,
        raw_payload: item.raw_payload ?? {},
      });
    }

    let inserted = 0;
    let insertError: string | null = null;

    if (toInsert.length > 0) {
      const { data: inserted_rows, error: insertErr } = await serviceClient
        .from('signals')
        .insert(toInsert)
        .select('id');

      if (insertErr) {
        insertError = insertErr.message;
      } else {
        inserted = inserted_rows?.length ?? 0;
      }
    }

    // Update sync run
    await serviceClient
      .from('source_sync_runs')
      .update({
        status: insertError ? 'failed' : 'completed',
        items_normalized: inserted,
        completed_at: new Date().toISOString(),
        error_message: insertError,
        raw_summary: {
          received: input.items.length,
          validated: validatedItems.length,
          inserted,
          skipped_duplicates: skippedDuplicates,
          validation_errors: validationErrors.length,
        },
      })
      .eq('id', syncRun.id);

    // Update source last_sync_at
    await serviceClient
      .from('data_sources')
      .update({
        last_sync_at: new Date().toISOString(),
        status: insertError ? 'error' : 'active',
      })
      .eq('id', source.id);

    return new Response(
      JSON.stringify({
        success: !insertError,
        sync_run_id: syncRun.id,
        source_id: source.id,
        received: input.items.length,
        inserted,
        skipped_duplicates: skippedDuplicates,
        failed: validationErrors.length,
        error: insertError,
      }),
      {
        status: insertError ? 207 : 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[ingest-source-payload] error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
