import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type SummaryType = 'executive_brief' | 'technical_brief' | 'weekly_watch_brief';

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableKey  = Deno.env.get('LOVABLE_API_KEY');

    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Input ─────────────────────────────────────────────────────────────────
    const body = await req.json();
    const summaryType: SummaryType = body.summary_type ?? 'executive_brief';
    const orgId: string = body.organization_id;

    if (!orgId) {
      return new Response(JSON.stringify({ error: 'organization_id required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Service client for data reads ─────────────────────────────────────────
    const sb = createClient(supabaseUrl, serviceKey);

    // ── Aggregate fact pack from DB ───────────────────────────────────────────
    const [risksRes, actionsRes, alertsRes, analysesRes] = await Promise.all([
      sb.from('risk_register')
        .select('id, title, risk_level, score, status, business_impact, technical_impact, due_date, owner')
        .eq('organization_id', orgId)
        .in('status', ['open', 'in_treatment'])
        .order('score', { ascending: false })
        .limit(20),
      sb.from('remediation_actions')
        .select('id, title, priority, status, due_date, expected_gain, implementation_notes')
        .eq('organization_id', orgId)
        .in('status', ['open', 'in_progress'])
        .order('priority', { ascending: false })
        .limit(20),
      sb.from('alerts')
        .select('id, title, severity, alert_type, status, created_at, description')
        .eq('organization_id', orgId)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(10),
      sb.from('ai_analyses')
        .select('id, analysis_type, output_json, created_at')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(5),
    ]);

    const risks      = risksRes.data   ?? [];
    const actions    = actionsRes.data ?? [];
    const alerts     = alertsRes.data  ?? [];
    const analyses   = analysesRes.data ?? [];

    // ── Compute derived stats ─────────────────────────────────────────────────
    const criticalRisks = risks.filter(r => r.risk_level === 'critical').length;
    const highRisks     = risks.filter(r => r.risk_level === 'high').length;
    const avgScore      = risks.length > 0
      ? Math.round(risks.reduce((s: number, r: { score: number }) => s + (r.score ?? 0), 0) / risks.length)
      : 0;
    const overdueActions = actions.filter(a => a.due_date && new Date(a.due_date) < new Date()).length;
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;

    const sourceSnapshot = {
      open_risks:       risks.length,
      critical_risks:   criticalRisks,
      high_risks:       highRisks,
      avg_risk_score:   avgScore,
      pending_actions:  actions.length,
      overdue_actions:  overdueActions,
      open_alerts:      alerts.length,
      critical_alerts:  criticalAlerts,
      ai_analyses:      analyses.length,
      computed_at:      new Date().toISOString(),
    };

    // ── Deterministic fallback output ─────────────────────────────────────────
    const overallRiskLevel = criticalRisks > 0 ? 'critical'
      : highRisks > 0 ? 'high'
      : risks.length > 0 ? 'medium'
      : 'low';

    const topRiskTitles = risks.slice(0, 5).map(r => r.title);
    const topActionTitles = actions.slice(0, 5).map(a => a.title);

    let fallbackOutput: Record<string, unknown> = {};
    const periodLabel = `Semaine du ${new Date().toLocaleDateString('fr-FR')}`;

    if (summaryType === 'executive_brief') {
      fallbackOutput = {
        headline: `${risks.length} risque(s) ouvert(s) · ${criticalRisks} critique(s) · score moyen ${avgScore}`,
        overall_risk_level: overallRiskLevel,
        top_risks: topRiskTitles,
        business_exposure_summary: criticalRisks > 0
          ? `Exposition critique détectée — ${criticalRisks} risque(s) critique(s) nécessitant une action immédiate.`
          : highRisks > 0
          ? `Exposition élevée — ${highRisks} risque(s) de niveau haut en cours de traitement.`
          : `Exposition modérée — ${risks.length} risque(s) sous surveillance active.`,
        priority_actions: topActionTitles,
        board_message: criticalRisks > 0
          ? `Attention requise du COMEX — ${criticalRisks} risque(s) critique(s) identifié(s). Plan d'action immédiat recommandé.`
          : `La posture de sécurité est sous contrôle. ${risks.length} risque(s) actif(s) — surveillance continue assurée.`,
      };
    } else if (summaryType === 'technical_brief') {
      const riskClusters = Array.from(new Set(risks.map(r => r.risk_level)))
        .map(level => `${level}: ${risks.filter(r => r.risk_level === level).length} risque(s)`);
      fallbackOutput = {
        headline: `${risks.length} risque(s) · ${actions.length} action(s) · ${criticalAlerts} alerte(s) critique(s)`,
        top_risk_clusters: riskClusters,
        critical_assets: risks.filter(r => r.risk_level === 'critical').map(r => r.title),
        stale_risks_summary: overdueActions > 0
          ? `${overdueActions} action(s) en retard détectée(s). Risque de dégradation de la posture.`
          : `Aucune action en retard — remédiation dans les délais.`,
        priority_remediation_actions: topActionTitles,
        technical_message: `Moteur actif — ${risks.length} risque(s) dans risk_register · ${actions.length} action(s) en file · ${alerts.length} alerte(s) ouverte(s).`,
      };
    } else {
      // weekly_watch_brief
      const newAlerts = alerts.filter(a => {
        const d = new Date(a.created_at);
        const week = new Date(); week.setDate(week.getDate() - 7);
        return d > week;
      });
      fallbackOutput = {
        headline: `Watch Brief — ${periodLabel}`,
        new_alerts_summary: newAlerts.length > 0
          ? `${newAlerts.length} nouvelle(s) alerte(s) cette semaine · ${criticalAlerts} critique(s)`
          : `Aucune nouvelle alerte cette semaine — plateforme stable.`,
        top_changes: topRiskTitles.slice(0, 3),
        top_actions_this_week: topActionTitles.slice(0, 3),
      };
    }

    // ── Gemini enrichment (if key available) ──────────────────────────────────
    let outputJson = fallbackOutput;
    let modelName  = 'deterministic_fallback';
    let aiUsed     = false;

    if (lovableKey && risks.length > 0) {
      try {
        const systemPrompt = `Tu es un analyste cybersécurité senior. Tu synthétises les données de risques d'une organisation en ${summaryType}. Tu réponds UNIQUEMENT en JSON valide (sans markdown), en respectant exactement le schéma demandé. Sois concis, crédible, sans hallucination.`;

        const factPackText = JSON.stringify({
          summary_type: summaryType,
          stats: sourceSnapshot,
          top_risks: risks.slice(0, 8).map(r => ({
            title: r.title, level: r.risk_level, score: r.score,
            business_impact: r.business_impact?.slice(0, 100),
          })),
          top_actions: actions.slice(0, 6).map(a => ({
            title: a.title, priority: a.priority, overdue: a.due_date && new Date(a.due_date) < new Date(),
          })),
          recent_alerts: alerts.slice(0, 5).map(a => ({ title: a.title, severity: a.severity })),
        });

        const schemaPrompt = summaryType === 'executive_brief'
          ? `Génère un executive_brief JSON avec ces champs EXACTS: headline (string), overall_risk_level (low|medium|high|critical), top_risks (array<string> max 5), business_exposure_summary (string), priority_actions (array<string> max 5), board_message (string)`
          : summaryType === 'technical_brief'
          ? `Génère un technical_brief JSON avec ces champs EXACTS: headline (string), top_risk_clusters (array<string>), critical_assets (array<string>), stale_risks_summary (string), priority_remediation_actions (array<string> max 5), technical_message (string)`
          : `Génère un weekly_watch_brief JSON avec ces champs EXACTS: headline (string), new_alerts_summary (string), top_changes (array<string> max 3), top_actions_this_week (array<string> max 3)`;

        const aiRes = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: `Données:\n${factPackText}\n\nInstruction: ${schemaPrompt}` },
            ],
            temperature: 0.3,
          }),
        });

        if (aiRes.ok) {
          const aiJson = await aiRes.json();
          const rawContent = aiJson?.choices?.[0]?.message?.content ?? '';
          // Strip markdown code fences if present
          const cleaned = rawContent.replace(/^```json?\s*/i, '').replace(/\s*```\s*$/, '').trim();
          const parsed  = JSON.parse(cleaned);
          outputJson = parsed;
          modelName  = aiJson?.model ?? 'google/gemini-2.5-flash';
          aiUsed     = true;
        }
      } catch (aiErr) {
        console.warn('Gemini enrichment failed, using fallback:', aiErr);
      }
    }

    // ── Persist to portfolio_summaries ────────────────────────────────────────
    const { data: saved, error: saveErr } = await sb
      .from('portfolio_summaries')
      .insert({
        organization_id: orgId,
        summary_type:    summaryType,
        model_name:      modelName,
        source_snapshot: sourceSnapshot,
        output_json:     outputJson,
        period_label:    body.period_label ?? periodLabel,
      })
      .select()
      .single();

    if (saveErr) {
      console.error('Failed to save portfolio summary:', saveErr);
    }

    return new Response(JSON.stringify({
      success:      true,
      summary_id:   saved?.id ?? null,
      summary_type: summaryType,
      model_name:   modelName,
      ai_used:      aiUsed,
      source_snapshot: sourceSnapshot,
      output:       outputJson,
      period_label: body.period_label ?? periodLabel,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('generate-portfolio-summary error:', err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
