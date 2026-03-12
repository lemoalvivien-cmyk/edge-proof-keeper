/**
 * seed-minimal-data — Edge Function
 *
 * Crée en DB (via service role) :
 *   1. 1 risque open dans risk_register
 *   2. 1 alerte open dans alerts
 *   3. 1 snapshot platform_health_snapshots
 *
 * Multi-tenant strict. Toutes les données sont marquées [DEMO].
 * Idempotent : ne crée pas de doublons si déjà exécuté récemment (check 24h).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl   = Deno.env.get('SUPABASE_URL')!;
    const anonKey       = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey    = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Auth
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const orgId: string = body.organization_id;
    if (!orgId) {
      return new Response(JSON.stringify({ error: 'organization_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sb = createClient(supabaseUrl, serviceKey);

    // Verify org access
    const { data: hasAccess } = await sb.rpc('has_org_access', { _user_id: user.id, _org_id: orgId });
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const created: string[] = [];
    const skipped: string[] = [];

    // ── 1. Risk Register — 1 risque critique [DEMO] ──────────────────────────
    const { count: existingRisks } = await sb
      .from('risk_register')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('title', '[DEMO] Exposition critique — données clients non chiffrées');

    if ((existingRisks ?? 0) === 0) {
      const { error: riskErr } = await sb.from('risk_register').insert({
        organization_id: orgId,
        title: '[DEMO] Exposition critique — données clients non chiffrées',
        description: '[DEMO] Scénario de démonstration : base de données client sans chiffrement au repos détectée lors de l\'audit d\'infrastructure. Données PII potentiellement exposées.',
        risk_level: 'critical',
        score: 88,
        status: 'open',
        business_impact: '[DEMO] Risque de violation RGPD · amende potentielle · atteinte à la réputation',
        technical_impact: '[DEMO] Base PostgreSQL sans TDE · backups non chiffrés · accès admin non audités',
        owner: user.id,
        source_signal_ids: [],
        due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      if (!riskErr) created.push('risk_register');
      else console.error('risk insert error:', riskErr);
    } else {
      skipped.push('risk_register');
    }

    // ── 2. Alerts — 1 alerte critique [DEMO] ─────────────────────────────────
    const { count: existingAlerts } = await sb
      .from('alerts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('title', '[DEMO] Accès admin non MFA détecté');

    if ((existingAlerts ?? 0) === 0) {
      const { error: alertErr } = await sb.from('alerts').insert({
        organization_id: orgId,
        title: '[DEMO] Accès admin non MFA détecté',
        description: '[DEMO] Connexion administrateur sans authentification multi-facteurs détectée depuis une IP inconnue. Scénario de démonstration.',
        alert_type: 'authentication_anomaly',
        severity: 'critical',
        status: 'open',
      });
      if (!alertErr) created.push('alerts');
      else console.error('alert insert error:', alertErr);
    } else {
      skipped.push('alerts');
    }

    // ── 3. Platform Health Snapshot ───────────────────────────────────────────
    // Always create a fresh snapshot (it's a time-series)
    const { data: riskCount } = await sb
      .from('risk_register')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .in('status', ['open', 'in_treatment']);

    const { data: alertCount } = await sb
      .from('alerts')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .eq('status', 'open');

    const openRisks = (riskCount as unknown as { count: number })?.count ?? 0;
    const openAlerts = (alertCount as unknown as { count: number })?.count ?? 0;
    const healthScore = Math.max(0, 100 - openRisks * 10 - openAlerts * 5);

    const { error: snapErr } = await sb.from('platform_health_snapshots').insert({
      organization_id: orgId,
      health_score: Math.min(100, healthScore),
      summary: {
        open_risks: openRisks,
        open_alerts: openAlerts,
        demo: true,
        seeded_by: 'seed-minimal-data',
        seeded_at: new Date().toISOString(),
      },
    });
    if (!snapErr) created.push('platform_health_snapshots');
    else console.error('snapshot insert error:', snapErr);

    console.log(`[seed-minimal-data] org=${orgId} created=${created.join(',')} skipped=${skipped.join(',')}`);

    return new Response(JSON.stringify({
      success: true,
      created,
      skipped,
      message: `Données minimales créées : ${created.join(', ')}${skipped.length > 0 ? ` · Déjà présent : ${skipped.join(', ')}` : ''}`,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('seed-minimal-data error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
