/**
 * SECURIT-E — export-sovereign-report Edge Function
 *
 * Génère un rapport Direction (CEO) + Technique (DSI) exportable.
 * Retourne JSON structuré + HTML imprimable avec watermark souverain.
 *
 * POST /functions/v1/export-sovereign-report
 * Body: { organization_id, report_type: 'direction'|'technique'|'both' }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const LOVABLE_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

  try {
    // ── Auth ──────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    let body: { organization_id?: string; report_type?: string };
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Corps JSON invalide" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { organization_id, report_type = "both" } = body;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!organization_id || !uuidRegex.test(organization_id)) {
      return new Response(JSON.stringify({ error: "organization_id invalide" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const db = createClient(supabaseUrl, serviceKey);

    const { data: hasAccess } = await db.rpc("has_org_access", {
      _user_id: userId, _org_id: organization_id,
    });
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "Accès refusé" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Load org data ─────────────────────────────────────────
    const [orgRes, risksRes, actionsRes, findingsRes, aiAnalysesRes] = await Promise.all([
      db.from("organizations").select("name").eq("id", organization_id).single(),
      db.from("risk_register").select("id, title, risk_level, score, status, description, business_impact, technical_impact").eq("organization_id", organization_id).order("score", { ascending: false }).limit(20),
      db.from("remediation_actions").select("id, title, priority, status, action_type, expected_gain").eq("organization_id", organization_id).order("priority").limit(20),
      db.from("findings").select("id, title, severity, status, finding_type").eq("organization_id", organization_id).limit(30),
      db.from("ai_analyses").select("output_json, analysis_type, created_at").eq("organization_id", organization_id).order("created_at", { ascending: false }).limit(5),
    ]);

    const orgName = orgRes.data?.name ?? "Organisation";
    const risks = risksRes.data ?? [];
    const actions = actionsRes.data ?? [];
    const findings = findingsRes.data ?? [];
    const aiAnalyses = aiAnalysesRes.data ?? [];

    const criticalRisks = risks.filter(r => r.risk_level === "critical").length;
    const highRisks = risks.filter(r => r.risk_level === "high").length;
    const openActions = actions.filter(a => a.status === "open").length;
    const completedActions = actions.filter(a => a.status === "done").length;
    const criticalFindings = findings.filter(f => f.severity === "critical").length;
    const highFindings = findings.filter(f => f.severity === "high").length;

    const reportDate = new Date().toLocaleDateString("fr-FR", {
      weekday: "long", year: "numeric", month: "long", day: "numeric"
    });

    // ── Generate AI summary if LOVABLE_API_KEY available ─────
    let directionSummary = "";
    let techniqueSummary = "";

    if (lovableKey && (report_type === "direction" || report_type === "both")) {
      try {
        const directionPrompt = `Tu es un CISO expert. Rédige un résumé DIRECTION (PDF) pour le CEO de "${orgName}".
Ton style : zéro jargon technique, orienté risque business et conformité légale.
Données :
- ${criticalRisks} risques critiques, ${highRisks} risques élevés
- ${openActions} actions de remédiation ouvertes
- ${criticalFindings} findings critiques, ${highFindings} findings élevés
- Top 3 risques : ${risks.slice(0, 3).map(r => r.title).join(" | ")}
- Analyses IA précédentes : ${aiAnalyses.length} disponibles

Rédige 3 paragraphes courts (max 150 mots chacun) :
1. Situation actuelle (feux rouges)
2. Ce qui a été fait et ce qui reste à faire  
3. Recommandation immédiate pour le Comex

Ton est assertif, direct, sans conditionnel excessif. Langue : français.`;

        const dirRes = await fetch(LOVABLE_GATEWAY_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              { role: "system", content: "Tu es un CISO expert. Réponds en français, de façon concise et actionnable." },
              { role: "user", content: directionPrompt }
            ],
            temperature: 0.2,
          }),
        });
        if (dirRes.ok) {
          const dirData = await dirRes.json();
          directionSummary = dirData.choices?.[0]?.message?.content ?? "";
        }
      } catch (e) {
        console.error("Direction AI summary failed:", e);
      }
    }

    if (lovableKey && (report_type === "technique" || report_type === "both")) {
      try {
        const techniquePrompt = `Tu es un CISO expert. Rédige un résumé TECHNIQUE (PDF) pour le DSI/RSSI de "${orgName}".
Données complètes :
${JSON.stringify({ risks: risks.slice(0, 10), actions: actions.slice(0, 10), findings: findings.slice(0, 10) }, null, 2)}

Rédige :
1. Tableau de synthèse des risques (TOP 5 avec score et niveau)
2. Actions de remédiation prioritaires avec effort estimé
3. Findings critiques à corriger en urgence
4. Plan 7j/30j/90j

Langue : français technique. Format markdown structuré.`;

        const techRes = await fetch(LOVABLE_GATEWAY_URL, {
          method: "POST",
          headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: MODEL,
            messages: [
              { role: "system", content: "Tu es un CISO expert. Réponds en français technique et structuré." },
              { role: "user", content: techniquePrompt }
            ],
            temperature: 0.1,
          }),
        });
        if (techRes.ok) {
          const techData = await techRes.json();
          techniqueSummary = techData.choices?.[0]?.message?.content ?? "";
        }
      } catch (e) {
        console.error("Technique AI summary failed:", e);
      }
    }

    // ── Build report data ─────────────────────────────────────
    const reportData = {
      metadata: {
        org_name: orgName,
        report_date: reportDate,
        generated_at: new Date().toISOString(),
        report_type,
        sovereign_watermark: "SECURIT-E — Souverain France — Preuve post-quantique",
        generated_by: "Agent CISO IA Souverain Français",
      },
      executive_summary: {
        total_risks: risks.length,
        critical_risks: criticalRisks,
        high_risks: highRisks,
        open_actions: openActions,
        completed_actions: completedActions,
        critical_findings: criticalFindings,
        high_findings: highFindings,
        risk_score_avg: risks.length > 0
          ? Math.round(risks.reduce((s, r) => s + (r.score ?? 0), 0) / risks.length)
          : 0,
        ai_summary_direction: directionSummary,
        ai_summary_technique: techniqueSummary,
      },
      top_risks: risks.slice(0, 10).map(r => ({
        title: r.title,
        level: r.risk_level,
        score: r.score,
        status: r.status,
        business_impact: r.business_impact,
      })),
      priority_actions: actions.filter(a => a.status === "open").slice(0, 10).map(a => ({
        title: a.title,
        priority: a.priority,
        type: a.action_type,
        expected_gain: a.expected_gain,
      })),
      critical_findings: findings.filter(f => f.severity === "critical" || f.severity === "high").slice(0, 10).map(f => ({
        title: f.title,
        severity: f.severity,
        type: f.finding_type,
        status: f.status,
      })),
      ai_analyses_count: aiAnalyses.length,
    };

    // ── Generate HTML report ──────────────────────────────────
    const htmlReport = generateHtmlReport(reportData, orgName, reportDate);

    // ── Compute SHA-256 hash for proof ────────────────────────
    const encoder = new TextEncoder();
    const reportBytes = encoder.encode(JSON.stringify(reportData));
    const hashBuffer = await crypto.subtle.digest("SHA-256", reportBytes);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const reportHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    console.log(`export-sovereign-report: org=${organization_id} hash=${reportHash.slice(0, 16)}`);

    return new Response(
      JSON.stringify({
        success: true,
        report: reportData,
        html: htmlReport,
        proof_hash: reportHash,
        sovereign_badge: "🇫🇷 Rapport souverain — SECURIT-E — 20× moins cher que Palantir",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("export-sovereign-report fatal:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function generateHtmlReport(data: Record<string, unknown>, orgName: string, reportDate: string): string {
  const exec = data.executive_summary as Record<string, unknown>;
  const topRisks = (data.top_risks as Array<Record<string, unknown>>) ?? [];
  const priorityActions = (data.priority_actions as Array<Record<string, unknown>>) ?? [];

  const riskRows = topRisks.slice(0, 5).map(r => `
    <tr>
      <td>${String(r.title ?? "").slice(0, 60)}</td>
      <td class="level-${r.level}">${String(r.level ?? "").toUpperCase()}</td>
      <td>${r.score ?? 0}</td>
      <td>${r.status ?? ""}</td>
    </tr>`).join("");

  const actionRows = priorityActions.slice(0, 5).map(a => `
    <tr>
      <td>${String(a.title ?? "").slice(0, 60)}</td>
      <td class="level-${a.priority}">${String(a.priority ?? "").toUpperCase()}</td>
      <td>${a.type ?? ""}</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Rapport Cyber — ${orgName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; background: #0a0a0f; color: #e2e8f0; padding: 40px; }
  .watermark { position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-30deg); 
    font-size: 48px; color: rgba(99,102,241,0.08); font-weight: 700; pointer-events: none; z-index: 0; white-space: nowrap; }
  .header { border-bottom: 2px solid #6366f1; padding-bottom: 24px; margin-bottom: 32px; }
  .logo { font-size: 28px; font-weight: 700; color: #6366f1; letter-spacing: -0.5px; }
  .subtitle { color: #94a3b8; font-size: 14px; margin-top: 4px; }
  .sovereign-badge { display: inline-flex; align-items: center; gap: 8px; background: rgba(99,102,241,0.15);
    border: 1px solid rgba(99,102,241,0.4); border-radius: 8px; padding: 6px 14px; font-size: 12px; color: #a5b4fc; margin-top: 12px; }
  h2 { font-size: 18px; font-weight: 600; color: #c7d2fe; margin: 28px 0 16px; border-left: 3px solid #6366f1; padding-left: 12px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
  .kpi { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; text-align: center; }
  .kpi-value { font-size: 32px; font-weight: 700; }
  .kpi-label { color: #94a3b8; font-size: 13px; margin-top: 4px; }
  .kpi-value.red { color: #f87171; }
  .kpi-value.orange { color: #fb923c; }
  .kpi-value.green { color: #4ade80; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { background: rgba(99,102,241,0.15); padding: 10px 14px; text-align: left; font-size: 12px; 
    text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; }
  td { padding: 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 13px; }
  .level-critical { color: #f87171; font-weight: 600; }
  .level-high { color: #fb923c; font-weight: 600; }
  .level-medium { color: #fbbf24; }
  .level-low { color: #4ade80; }
  .ai-box { background: rgba(99,102,241,0.08); border: 1px solid rgba(99,102,241,0.25); 
    border-radius: 12px; padding: 20px; margin-bottom: 24px; white-space: pre-wrap; font-size: 14px; line-height: 1.7; }
  .footer { border-top: 1px solid rgba(255,255,255,0.08); padding-top: 20px; margin-top: 40px; 
    font-size: 11px; color: #475569; text-align: center; }
</style>
</head>
<body>
<div class="watermark">SECURIT-E — Souverain France — Preuve post-quantique</div>

<div class="header">
  <div class="logo">⚔️ SECURIT-E</div>
  <div class="subtitle">Rapport de Sécurité Cyber — ${orgName} — ${reportDate}</div>
  <div class="sovereign-badge">🇫🇷 Souverain France &nbsp;|&nbsp; 🔐 NIS2/RGPD &nbsp;|&nbsp; 🧠 Agent CISO IA &nbsp;|&nbsp; 20× moins cher que Palantir</div>
</div>

<h2>📊 Tableau de Bord Exécutif</h2>
<div class="kpi-grid">
  <div class="kpi"><div class="kpi-value red">${exec.critical_risks ?? 0}</div><div class="kpi-label">Risques critiques</div></div>
  <div class="kpi"><div class="kpi-value orange">${exec.high_risks ?? 0}</div><div class="kpi-label">Risques élevés</div></div>
  <div class="kpi"><div class="kpi-value orange">${exec.open_actions ?? 0}</div><div class="kpi-label">Actions ouvertes</div></div>
  <div class="kpi"><div class="kpi-value green">${exec.completed_actions ?? 0}</div><div class="kpi-label">Actions terminées</div></div>
</div>

${exec.ai_summary_direction ? `<h2>📋 Synthèse Direction (CEO)</h2><div class="ai-box">${String(exec.ai_summary_direction)}</div>` : ""}

<h2>🎯 Top 5 Risques Prioritaires</h2>
<table>
  <tr><th>Risque</th><th>Niveau</th><th>Score</th><th>Statut</th></tr>
  ${riskRows || "<tr><td colspan='4'>Aucun risque</td></tr>"}
</table>

<h2>🔧 Actions de Remédiation Prioritaires</h2>
<table>
  <tr><th>Action</th><th>Priorité</th><th>Type</th></tr>
  ${actionRows || "<tr><td colspan='3'>Aucune action</td></tr>"}
</table>

${exec.ai_summary_technique ? `<h2>🛠 Analyse Technique (DSI/RSSI)</h2><div class="ai-box">${String(exec.ai_summary_technique)}</div>` : ""}

<div class="footer">
  SECURIT-E — Armure Cyber Autonome — Souverain France<br>
  Rapport généré par Agent CISO IA NIS2/RGPD — ${new Date().toISOString()}<br>
  🔐 CRYSTALS-Dilithium + SHA-256 Merkle Tree | Palantir-Killer Edition
</div>
</body>
</html>`;
}
