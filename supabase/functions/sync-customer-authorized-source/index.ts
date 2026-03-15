import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * sync-customer-authorized-source
 *
 * Ingestion from customer-authorized sources:
 *   - cloud inventory exports (AWS/GCP/Azure authorized scan results)
 *   - internal tool exports (Nessus, Qualys, Wiz, etc.)
 *   - partner-sourced authorized data
 *
 * All data must be explicitly authorized by the customer.
 * No active scanning. Data pull only.
 */

interface AuthorizedPayloadItem {
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
  external_id?: string; // external unique ID for deduplication
}

interface AuthorizedSyncPayload {
  source_id: string;
  items: AuthorizedPayloadItem[];
  provider_name?: string; // e.g. "aws_security_hub", "qualys", "wiz"
  import_context?: Record<string, unknown>;
}

const SEVERITY_MAP: Record<string, string> = {
  critical: 'critical', crit: 'critical', 'severity_critical': 'critical',
  high: 'high', 'severity_high': 'high',
  medium: 'medium', med: 'medium', moderate: 'medium', 'severity_medium': 'medium',
  low: 'low', 'severity_low': 'low',
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
  orgId: string;
  sourceId: string;
  signalType: string;
  category: string;
  title: string;
  assetId?: string | null;
  externalId?: string;
}): string {
  // If external_id is provided, use it as primary dedupe anchor
  if (params.externalId) {
    return [params.orgId, params.sourceId, 'ext', params.externalId].join(':');
  }
  return [
    params.orgId,
    params.sourceId,
    params.signalType.trim().toLowerCase(),
    params.category.trim().toLowerCase(),
    params.title.trim().toLowerCase().slice(0, 200),
    params.assetId ?? 'none',
  ].join(':');
}

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
      return new Response(JSON.stringify({ error: 'source_id is required' }), {
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
    if (payload.items.length > 1000) {
      return new Response(JSON.stringify({ error: 'Max 1000 items per authorized sync batch' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const input = payload as AuthorizedSyncPayload;

    // Get org
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();

    if (!profile?.organization_id) {
      return new Response(JSON.stringify({ error: 'User has no organization' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const orgId = profile.organization_id;

    // Validate source
    const { data: source, error: sourceError } = await serviceClient
      .from('data_sources')
      .select('id, organization_id, source_type, name, config')
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

    // Build signals
    const validationErrors: string[] = [];
    const signalRows = [];

    for (let i = 0; i < input.items.length; i++) {
      const item = input.items[i] as AuthorizedPayloadItem;

      if (!item?.signal_type || !item?.category || !item?.title) {
        validationErrors.push(`Item[${i}]: signal_type, category, title are required`);
        continue;
      }

      const dedupeKey = buildDedupeKey({
        orgId,
        sourceId: source.id,
        signalType: item.signal_type,
        category: item.category,
        title: item.title,
        assetId: item.asset_id,
        externalId: item.external_id,
      });

      signalRows.push({
        dedupeKey,
        row: {
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
          evidence: {
            ...(item.evidence ?? {}),
            ...(input.provider_name ? { provider: input.provider_name } : {}),
            ...(item.external_id ? { external_id: item.external_id } : {}),
          },
          signal_refs: item.references ?? [],
          detected_at: item.detected_at ?? new Date().toISOString(),
          status: 'new',
          dedupe_key: dedupeKey,
          raw_payload: {
            ...(item.raw_payload ?? {}),
            ...(input.import_context ? { import_context: input.import_context } : {}),
          },
        },
      });
    }

    // Dedup check
    const dedupeKeys = signalRows.map(s => s.dedupeKey);
    let existingKeys = new Set<string | null>();

    if (dedupeKeys.length > 0) {
      const { data: existing } = await serviceClient
        .from('signals')
        .select('dedupe_key')
        .eq('organization_id', orgId)
        .in('dedupe_key', dedupeKeys);

      existingKeys = new Set((existing ?? []).map((s: { dedupe_key: string | null }) => s.dedupe_key));
    }

    const toInsert = signalRows.filter(s => !existingKeys.has(s.dedupeKey)).map(s => s.row);
    const skippedDuplicates = signalRows.length - toInsert.length;

    let inserted = 0;
    let insertError: string | null = null;

    if (toInsert.length > 0) {
      const { data: rows, error: ie } = await serviceClient
        .from('signals')
        .insert(toInsert)
        .select('id');

      if (ie) {
        insertError = ie.message;
      } else {
        inserted = rows?.length ?? 0;
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
          provider: input.provider_name ?? 'customer_authorized',
          received: input.items.length,
          inserted,
          skipped_duplicates: skippedDuplicates,
          validation_errors: validationErrors.length,
        },
      })
      .eq('id', syncRun.id);

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
        source_id: source.id,
        sync_run_id: syncRun.id,
        received: input.items.length,
        inserted,
        skipped_duplicates: skippedDuplicates,
        validation_errors: validationErrors.length > 0 ? validationErrors : undefined,
        error: insertError,
      }),
      {
        status: insertError ? 207 : 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[sync-customer-authorized-source] error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
