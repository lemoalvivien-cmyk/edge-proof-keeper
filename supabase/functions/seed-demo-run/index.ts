/**
 * seed-demo-run — Edge Function
 * Rate limit RÉEL : max 3 seeds par org par jour.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sha256(data: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function logEvidenceInternal(supabaseUrl: string, authHeader: string, internalToken: string, payload: Record<string, unknown>): Promise<void> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/log-evidence`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': authHeader, 'x-internal-token': internalToken }, body: JSON.stringify(payload) });
    if (!res.ok) console.warn('log-evidence failed:', await res.text());
  } catch (err) { console.warn('log-evidence error:', err); }
}

const DEMO_FINDINGS = [
  { title: '[DEMO] Exposition TLS 1.0 — chiffrement obsolète', finding_type: 'tls_issue', severity: 'high', confidence: 'high', evidence: { host: 'demo-app.example.com', protocol: 'tls', matched: 'TLS 1.0 accepté', demo: true }, references: ['CVE: CVE-2011-3389'] },
  { title: '[DEMO] Port 8080 exposé publiquement', finding_type: 'open_port', severity: 'medium', confidence: 'medium', evidence: { host: 'demo-api.example.com', port: 8080, demo: true }, references: [] },
  { title: '[DEMO] Clé API exposée dans dépôt Git public', finding_type: 'secret_leak', severity: 'critical', confidence: 'high', evidence: { host: 'github.com/demo-org/demo-repo', matched: 'API_KEY=sk-demo-XXXX...', demo: true }, references: ['https://cwe.mitre.org/data/definitions/798.html'] },
  { title: '[DEMO] Dépendance critique vulnérable — Log4Shell simulé', finding_type: 'dependency', severity: 'critical', confidence: 'high', evidence: { template: 'CVE-2021-44228', matched: 'log4j-core:2.14.0', demo: true }, references: ['CVE: CVE-2021-44228'] },
  { title: '[DEMO] Sous-domaine dangling — DNS non résolu', finding_type: 'subdomain', severity: 'low', confidence: 'medium', evidence: { host: 'staging-demo.example.com', demo: true }, references: [] },
  { title: '[DEMO] Mauvaise configuration IAC — bucket S3 public', finding_type: 'iac_misconfig', severity: 'high', confidence: 'high', evidence: { path: 'terraform/s3.tf', matched: 'acl = "public-read"', demo: true }, references: ['CWE: CWE-732'] },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const internalToken = Deno.env.get('INTERNAL_EDGE_TOKEN')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const userClient = createClient(supabaseUrl, supabaseAnonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = await req.json().catch(() => ({}));
    const orgId: string = body.organization_id;
    if (!orgId) return new Response(JSON.stringify({ error: 'organization_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const sb = createClient(supabaseUrl, serviceKey);

    const { data: hasAccess } = await sb.rpc('has_org_access', { _user_id: user.id, _org_id: orgId });
    if (!hasAccess) return new Response(JSON.stringify({ error: 'Access denied to organization' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // ── Rate limit RÉEL : max 3 seed-demo-run par org par jour ───────────────
    // On utilise un window de 1 min avec max=3, mais on veut "par jour"
    // On utilise un user_id = "org:<orgId>" pour que la limite soit par org
    // Note: la fenêtre est de 1 min dans check_rate_limit, donc on adapte:
    // On vérifie directement dans rate_limits si l'org a dépassé 3 seeds dans les 24h
    const { data: existingSeeds } = await sb
      .from('rate_limits')
      .select('request_count, window_start')
      .eq('user_id', `org-day:${orgId}`)
      .eq('function_name', 'seed-demo-run')
      .maybeSingle();

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    if (existingSeeds && new Date(existingSeeds.window_start) > oneDayAgo && existingSeeds.request_count >= 3) {
      return new Response(JSON.stringify({ error: 'Limite de 3 seeds/jour atteinte pour cette organisation' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '86400' } });
    }

    // Upsert le compteur quotidien
    await sb.from('rate_limits').upsert({
      user_id: `org-day:${orgId}`,
      function_name: 'seed-demo-run',
      window_start: existingSeeds && new Date(existingSeeds.window_start) > oneDayAgo ? existingSeeds.window_start : now.toISOString(),
      request_count: existingSeeds && new Date(existingSeeds.window_start) > oneDayAgo ? existingSeeds.request_count + 1 : 1,
    }, { onConflict: 'user_id,function_name' });

    let toolId: string;
    const { data: existingTool } = await sb.from('tools_catalog').select('id').eq('slug', 'nuclei').maybeSingle();
    if (existingTool) { toolId = existingTool.id; }
    else {
      const { data: anyTool } = await sb.from('tools_catalog').select('id').limit(1).maybeSingle();
      if (!anyTool) return new Response(JSON.stringify({ error: 'Aucun outil dans tools_catalog' }), { status: 422, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      toolId = anyTool.id;
    }

    const counts = { critical: DEMO_FINDINGS.filter(f => f.severity === 'critical').length, high: DEMO_FINDINGS.filter(f => f.severity === 'high').length, medium: DEMO_FINDINGS.filter(f => f.severity === 'medium').length, low: DEMO_FINDINGS.filter(f => f.severity === 'low').length, info: 0, total: DEMO_FINDINGS.length };

    const { data: toolRun, error: runErr } = await sb.from('tool_runs').insert({ organization_id: orgId, tool_id: toolId, mode: 'import_json', status: 'done', requested_by: user.id, authorization_id: null, normalized_output: { demo: true, findings: DEMO_FINDINGS, seeded_at: now.toISOString(), seeded_by: user.id }, completed_at: now.toISOString(), summary: { counts, demo: true } }).select('id').single();
    if (runErr || !toolRun) return new Response(JSON.stringify({ error: 'Échec création tool_run', detail: runErr?.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const toolRunId = toolRun.id;
    const canonicalFindings = DEMO_FINDINGS.map(f => ({ organization_id: orgId, tool_run_id: toolRunId, asset_id: null, title: f.title, finding_type: f.finding_type, severity: f.severity, confidence: f.confidence, evidence: f.evidence, references: f.references, status: 'open' }));
    const { data: insertedFindings } = await sb.from('findings').insert(canonicalFindings).select('id, severity, finding_type');
    const findingsInserted = insertedFindings?.length ?? 0;

    const artifactHash = await sha256(JSON.stringify({ tool_run_id: toolRunId, findings_count: findingsInserted, counts, demo: true }));
    await logEvidenceInternal(supabaseUrl, authHeader, internalToken, { organization_id: orgId, action: 'demo_seed_run_created', entity_type: 'tool_run', entity_id: toolRunId, artifact_hash: artifactHash, details: { tool_run_id: toolRunId, findings_count: findingsInserted, counts, demo: true } });

    console.log(`[seed-demo-run] Seeded org=${orgId} run=${toolRunId} findings=${findingsInserted}`);
    return new Response(JSON.stringify({ success: true, tool_run_id: toolRunId, findings_inserted: findingsInserted, counts, demo: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('seed-demo-run error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
