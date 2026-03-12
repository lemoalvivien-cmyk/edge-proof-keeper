import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * sync-public-intel-source
 *
 * Defensive-only ingestion from public/licensed intelligence sources.
 * No offensive actions. No active scanning. Read-only.
 *
 * Supported provider types (architecture-ready):
 *   - ct_logs          : Certificate Transparency (crt.sh public API)
 *   - cve_nvd          : NVD/CISA KEV feeds
 *   - dns_recon        : Passive DNS (requires licensed provider)
 *   - brand_monitoring : Typosquatting / brand impersonation via public sources
 *   - repo_exposure    : Public repository metadata exposure
 */

type ProviderStatus = 'ok' | 'not_configured' | 'unsupported_provider' | 'missing_api_key' | 'error';

interface SyncResult {
  success: boolean;
  source_id: string;
  provider: string;
  provider_status: ProviderStatus;
  sync_run_id: string | null;
  signals_ingested: number;
  message: string;
}

interface SignalToInsert {
  organization_id: string;
  source_id: string;
  signal_type: string;
  category: string;
  title: string;
  description: string;
  severity: string;
  confidence_score: number | null;
  evidence: Record<string, unknown>;
  signal_refs: string[];
  detected_at: string;
  status: string;
  dedupe_key: string;
  raw_payload: Record<string, unknown>;
}

function buildDedupeKey(orgId: string, sourceId: string, signalType: string, title: string): string {
  return [orgId, sourceId, signalType.toLowerCase(), title.trim().toLowerCase().slice(0, 200)].join(':');
}

// ─── CT Logs Provider (crt.sh — public, no auth) ─────────────────────────────

async function syncCtLogs(
  orgId: string,
  source: { id: string; config: Record<string, unknown> }
): Promise<{ signals: SignalToInsert[]; providerStatus: ProviderStatus; message: string }> {
  const domain = source.config?.domain as string | undefined;
  if (!domain) {
    return { signals: [], providerStatus: 'not_configured', message: 'domain not set in source config' };
  }

  try {
    const url = `https://crt.sh/?q=%.${encodeURIComponent(domain)}&output=json`;
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) {
      return { signals: [], providerStatus: 'error', message: `crt.sh returned ${res.status}` };
    }

    const data = await res.json() as Array<{
      name_value?: string;
      common_name?: string;
      issuer_name?: string;
      not_before?: string;
      not_after?: string;
    }>;

    if (!Array.isArray(data)) {
      return { signals: [], providerStatus: 'error', message: 'Unexpected response format from crt.sh' };
    }

    // Deduplicate by common_name
    const seen = new Set<string>();
    const signals: SignalToInsert[] = [];

    for (const cert of data.slice(0, 200)) {
      const cn = cert.common_name ?? cert.name_value ?? '';
      if (!cn || seen.has(cn)) continue;
      seen.add(cn);

      const dedupeKey = buildDedupeKey(orgId, source.id, 'cert_transparency', cn);
      signals.push({
        organization_id: orgId,
        source_id: source.id,
        signal_type: 'cert_transparency',
        category: 'exposure',
        title: `Certificate found: ${cn}`,
        description: `SSL/TLS certificate detected via Certificate Transparency logs for domain: ${cn}`,
        severity: 'info',
        confidence_score: 0.9,
        evidence: {
          common_name: cn,
          issuer: cert.issuer_name ?? '',
          not_before: cert.not_before ?? '',
          not_after: cert.not_after ?? '',
        },
        signal_refs: [`https://crt.sh/?q=${encodeURIComponent(cn)}`],
        detected_at: cert.not_before ?? new Date().toISOString(),
        status: 'new',
        dedupe_key: dedupeKey,
        raw_payload: cert as unknown as Record<string, unknown>,
      });
    }

    return { signals, providerStatus: 'ok', message: `${signals.length} certificates found` };
  } catch (err) {
    return { signals: [], providerStatus: 'error', message: `crt.sh error: ${(err as Error).message}` };
  }
}

// ─── CVE/NVD Provider (CISA KEV — public feed) ───────────────────────────────

async function syncCveNvd(
  orgId: string,
  source: { id: string; config: Record<string, unknown> }
): Promise<{ signals: SignalToInsert[]; providerStatus: ProviderStatus; message: string }> {
  try {
    const res = await fetch(
      'https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json',
      { signal: AbortSignal.timeout(20000) }
    );

    if (!res.ok) {
      return { signals: [], providerStatus: 'error', message: `CISA KEV returned ${res.status}` };
    }

    const data = await res.json() as {
      vulnerabilities?: Array<{
        cveID?: string;
        vulnerabilityName?: string;
        shortDescription?: string;
        severity?: string;
        dateAdded?: string;
        product?: string;
        vendorProject?: string;
      }>;
    };

    const vulnerabilities = data?.vulnerabilities ?? [];

    // Filter by technology tags if configured
    const techFilter = source.config?.tech_filter as string[] | undefined;

    const signals: SignalToInsert[] = [];
    for (const vuln of vulnerabilities.slice(0, 100)) {
      if (!vuln.cveID) continue;

      // Apply tech filter if configured
      if (techFilter && techFilter.length > 0) {
        const product = (vuln.product ?? '').toLowerCase();
        const vendor = (vuln.vendorProject ?? '').toLowerCase();
        const matches = techFilter.some(t =>
          product.includes(t.toLowerCase()) || vendor.includes(t.toLowerCase())
        );
        if (!matches) continue;
      }

      const title = `${vuln.cveID}: ${vuln.vulnerabilityName ?? 'Known exploited vulnerability'}`;
      const dedupeKey = buildDedupeKey(orgId, source.id, 'cve', vuln.cveID);

      signals.push({
        organization_id: orgId,
        source_id: source.id,
        signal_type: 'cve',
        category: 'vulnerability',
        title: title.slice(0, 500),
        description: vuln.shortDescription ?? '',
        severity: 'high', // CISA KEV = known exploited = at least high
        confidence_score: 0.95,
        evidence: {
          cve_id: vuln.cveID,
          product: vuln.product,
          vendor: vuln.vendorProject,
          date_added: vuln.dateAdded,
        },
        signal_refs: [`https://nvd.nist.gov/vuln/detail/${vuln.cveID}`],
        detected_at: vuln.dateAdded ? new Date(vuln.dateAdded).toISOString() : new Date().toISOString(),
        status: 'new',
        dedupe_key: dedupeKey,
        raw_payload: vuln as unknown as Record<string, unknown>,
      });
    }

    return { signals, providerStatus: 'ok', message: `${signals.length} CISA KEV entries ingested` };
  } catch (err) {
    return { signals: [], providerStatus: 'error', message: `CISA KEV error: ${(err as Error).message}` };
  }
}

// ─── Unsupported / Not Configured Stubs ──────────────────────────────────────

function notConfigured(providerType: string): { signals: SignalToInsert[]; providerStatus: ProviderStatus; message: string } {
  return {
    signals: [],
    providerStatus: 'not_configured',
    message: `Provider '${providerType}' requires additional configuration`,
  };
}

function unsupportedProvider(providerType: string): { signals: SignalToInsert[]; providerStatus: ProviderStatus; message: string } {
  return {
    signals: [],
    providerStatus: 'unsupported_provider',
    message: `Provider type '${providerType}' is not yet supported. Planned: dns_recon, brand_monitoring, repo_exposure`,
  };
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

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

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  try {
    const body = await req.json() as Record<string, unknown>;
    const sourceId = body?.source_id as string | undefined;

    if (!sourceId) {
      return new Response(JSON.stringify({ error: 'source_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve org
    const { data: profile } = await serviceClient
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return new Response(JSON.stringify({ error: 'User has no organization' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const orgId = profile.organization_id;

    const { data: source, error: sourceError } = await serviceClient
      .from('data_sources')
      .select('id, organization_id, source_type, name, config')
      .eq('id', sourceId)
      .eq('organization_id', orgId)
      .single();

    if (sourceError || !source) {
      return new Response(JSON.stringify({ error: 'Source not found or access denied' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const providerType = (source.config as Record<string, unknown>)?.provider_type as string | undefined
      ?? source.source_type;

    // Create sync run
    const { data: syncRun } = await serviceClient
      .from('source_sync_runs')
      .insert({
        organization_id: orgId,
        source_id: source.id,
        status: 'running',
        items_received: 0,
        items_normalized: 0,
      })
      .select('id')
      .single();

    const syncRunId = syncRun?.id ?? null;

    // Dispatch to provider
    let providerResult: { signals: SignalToInsert[]; providerStatus: ProviderStatus; message: string };

    const configuredSource = { id: source.id, config: source.config as Record<string, unknown> };

    switch (providerType) {
      case 'ct_logs':
      case 'cert_transparency':
        providerResult = await syncCtLogs(orgId, configuredSource);
        break;
      case 'cve_nvd':
      case 'cisa_kev':
        providerResult = await syncCveNvd(orgId, configuredSource);
        break;
      case 'dns_recon':
        providerResult = notConfigured(providerType);
        break;
      case 'brand_monitoring':
        providerResult = notConfigured(providerType);
        break;
      case 'repo_exposure':
        providerResult = notConfigured(providerType);
        break;
      default:
        providerResult = unsupportedProvider(providerType ?? 'unknown');
    }

    let inserted = 0;

    if (providerResult.providerStatus === 'ok' && providerResult.signals.length > 0) {
      // Check existing dedupe keys
      const dedupeKeys = providerResult.signals.map(s => s.dedupe_key);
      const { data: existing } = await serviceClient
        .from('signals')
        .select('dedupe_key')
        .eq('organization_id', orgId)
        .in('dedupe_key', dedupeKeys);

      const existingKeys = new Set((existing ?? []).map((s: { dedupe_key: string | null }) => s.dedupe_key));
      const toInsert = providerResult.signals.filter(s => !existingKeys.has(s.dedupe_key));

      if (toInsert.length > 0) {
        const { data: rows } = await serviceClient.from('signals').insert(toInsert).select('id');
        inserted = rows?.length ?? 0;
      }
    }

    // Update sync run
    if (syncRunId) {
      await serviceClient
        .from('source_sync_runs')
        .update({
          status: providerResult.providerStatus === 'ok' ? 'completed' : 'failed',
          items_received: providerResult.signals.length,
          items_normalized: inserted,
          completed_at: new Date().toISOString(),
          error_message: providerResult.providerStatus !== 'ok' ? providerResult.message : null,
          raw_summary: { provider: providerType, status: providerResult.providerStatus, inserted },
        })
        .eq('id', syncRunId);
    }

    await serviceClient
      .from('data_sources')
      .update({
        last_sync_at: new Date().toISOString(),
        status: providerResult.providerStatus === 'ok' ? 'active' : 'error',
      })
      .eq('id', source.id);

    const result: SyncResult = {
      success: providerResult.providerStatus === 'ok',
      source_id: source.id,
      provider: providerType ?? 'unknown',
      provider_status: providerResult.providerStatus,
      sync_run_id: syncRunId,
      signals_ingested: inserted,
      message: providerResult.message,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal error';
    console.error('[sync-public-intel-source] error:', message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
