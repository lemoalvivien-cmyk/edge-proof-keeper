/**
 * seed-minimal-data — Edge Function
 * Idempotent : vérifie si findings existent avant création.
 * Rate limit : max 3 exécutions par org par jour.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = await req.json().catch(() => ({}));
    const orgId: string = body.organization_id;
    if (!orgId) return new Response(JSON.stringify({ error: 'organization_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const sb = createClient(supabaseUrl, serviceKey);

    const { data: hasAccess } = await sb.rpc('has_org_access', { _user_id: user.id, _org_id: orgId });
    if (!hasAccess) return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // ── Rate limit quotidien par org ──────────────────────────────────────────
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const { data: rlEntry } = await sb.from('rate_limits').select('request_count, window_start').eq('user_id', `org-day:${orgId}`).eq('function_name', 'seed-minimal-data').maybeSingle();
    if (rlEntry && new Date(rlEntry.window_start) > oneDayAgo && rlEntry.request_count >= 3) {
      return new Response(JSON.stringify({ error: 'Limite de 3 seeds/jour atteinte pour cette organisation' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '86400' } });
    }
    await sb.from('rate_limits').upsert({ user_id: `org-day:${orgId}`, function_name: 'seed-minimal-data', window_start: rlEntry && new Date(rlEntry.window_start) > oneDayAgo ? rlEntry.window_start : now.toISOString(), request_count: rlEntry && new Date(rlEntry.window_start) > oneDayAgo ? rlEntry.request_count + 1 : 1 }, { onConflict: 'user_id,function_name' });

    const created: string[] = [];
    const skipped: string[] = [];

    // ── Idempotence : vérifier si des findings [DEMO] existent déjà ──────────
    const { count: existingFindings } = await sb.from('findings').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).ilike('title', '[DEMO]%');
    if ((existingFindings ?? 0) > 0) {
      skipped.push('findings_already_present');
    }

    // ── Risk Register ─────────────────────────────────────────────────────────
    const { count: existingRisks } = await sb.from('risk_register').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('title', '[DEMO] Exposition critique — données clients non chiffrées');
    if ((existingRisks ?? 0) === 0) {
      const { error: riskErr } = await sb.from('risk_register').insert({ organization_id: orgId, title: '[DEMO] Exposition critique — données clients non chiffrées', description: '[DEMO] Scénario de démonstration : base de données client sans chiffrement au repos.', risk_level: 'critical', score: 88, status: 'open', business_impact: '[DEMO] Risque de violation RGPD', technical_impact: '[DEMO] Base PostgreSQL sans TDE', owner: user.id, source_signal_ids: [], due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] });
      if (!riskErr) created.push('risk_register');
      else console.error('risk insert error:', riskErr);
    } else { skipped.push('risk_register'); }

    // ── Alerts ────────────────────────────────────────────────────────────────
    const { count: existingAlerts } = await sb.from('alerts').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('title', '[DEMO] Accès admin non MFA détecté');
    if ((existingAlerts ?? 0) === 0) {
      const { error: alertErr } = await sb.from('alerts').insert({ organization_id: orgId, title: '[DEMO] Accès admin non MFA détecté', description: '[DEMO] Connexion administrateur sans MFA détectée.', alert_type: 'authentication_anomaly', severity: 'critical', status: 'open' });
      if (!alertErr) created.push('alerts');
      else console.error('alert insert error:', alertErr);
    } else { skipped.push('alerts'); }

    // ── Platform Health Snapshot ──────────────────────────────────────────────
    const { data: riskCount } = await sb.from('risk_register').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).in('status', ['open', 'in_treatment']);
    const { data: alertCount } = await sb.from('alerts').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'open');
    const openRisks = (riskCount as unknown as { count: number })?.count ?? 0;
    const openAlerts = (alertCount as unknown as { count: number })?.count ?? 0;
    const healthScore = Math.max(0, Math.min(100, 100 - openRisks * 10 - openAlerts * 5));
    const { error: snapErr } = await sb.from('platform_health_snapshots').insert({ organization_id: orgId, health_score: healthScore, summary: { open_risks: openRisks, open_alerts: openAlerts, demo: true, seeded_by: 'seed-minimal-data', seeded_at: now.toISOString() } });
    if (!snapErr) created.push('platform_health_snapshots');
    else console.error('snapshot insert error:', snapErr);

    console.log(`[seed-minimal-data] org=${orgId} created=${created.join(',')} skipped=${skipped.join(',')}`);
    return new Response(JSON.stringify({ success: true, created, skipped }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('seed-minimal-data error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
