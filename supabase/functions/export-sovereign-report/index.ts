/**
 * SECURIT-E — export-sovereign-report Edge Function
 * Rate limiting RÉEL via DB (stateless-safe).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders, handleCors } from "../_shared/cors.ts";

const LOVABLE_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  const corsHeaders = buildCorsHeaders(req);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub;

    let body: { organization_id?: string; report_type?: string };
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Corps JSON invalide" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { organization_id, report_type = "both" } = body;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!organization_id || !uuidRegex.test(organization_id)) {
      return new Response(JSON.stringify({ error: "organization_id invalide" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const db = createClient(supabaseUrl, serviceKey);

    // ── Rate limit RÉEL via DB ────────────────────────────────────────────────
    const { data: allowed, error: rlErr } = await db.rpc("check_rate_limit", {
      p_user_id: userId,
      p_function_name: "export-sovereign-report",
      p_max_per_minute: 5,
    });
    if (rlErr) console.error("export-sovereign-report rate limit error:", rlErr.message);
    if (allowed === false) {
      return new Response(JSON.stringify({ error: "Limite de 5 exports/min atteinte" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" }
      });
    }

    const { data: hasAccess } = await db.rpc("has_org_access", { _user_id: userId, _org_id: organization_id });
    if (!hasAccess) return new Response(JSON.stringify({ error: "Accès refusé" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

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
    const reportDate = new Date().toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    let directionSummary = "";
    let techniqueSummary = "";

    if (lovableKey && (report_type === "direction" || report_type === "both")) {
      try {
        const dirRes = await fetch(LOVABLE_GATEWAY_URL, { method: "POST", headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: MODEL, messages: [{ role: "system", content: "Tu es un CISO expert. Réponds en français, de façon concise et actionnable." }, { role: "user", content: `Rédige un résumé DIRECTION pour le CEO de "${orgName}". Données : ${criticalRisks} risques critiques, ${highRisks} élevés, ${openActions} actions ouvertes. Top 3 risques : ${risks.slice(0, 3).map(r => r.title).join(" | ")}. 3 paragraphes courts (max 150 mots chacun) : situation actuelle, ce qui est fait, recommandation Comex. Langue : français.` }], temperature: 0.2 }) });
        if (dirRes.ok) { const d = await dirRes.json(); directionSummary = d.choices?.[0]?.message?.content ?? ""; }
      } catch (e) { console.error("Direction AI summary failed:", e); }
    }

    if (lovableKey && (report_type === "technique" || report_type === "both")) {
      try {
        const techRes = await fetch(LOVABLE_GATEWAY_URL, { method: "POST", headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: MODEL, messages: [{ role: "system", content: "Tu es un CISO expert. Réponds en français technique et structuré." }, { role: "user", content: `Rédige un résumé TECHNIQUE pour le DSI/RSSI de "${orgName}". Données : ${JSON.stringify({ risks: risks.slice(0, 10), actions: actions.slice(0, 10), findings: findings.slice(0, 10) }, null, 2)}. Format markdown structuré.` }], temperature: 0.1 }) });
        if (techRes.ok) { const d = await techRes.json(); techniqueSummary = d.choices?.[0]?.message?.content ?? ""; }
      } catch (e) { console.error("Technique AI summary failed:", e); }
    }

    const reportData = {
      metadata: { org_name: orgName, report_date: reportDate, generated_at: new Date().toISOString(), report_type, sovereign_watermark: "SECURIT-E — Souverain France — Preuve post-quantique", generated_by: "Agent CISO IA Souverain Français" },
      executive_summary: { total_risks: risks.length, critical_risks: criticalRisks, high_risks: highRisks, open_actions: openActions, completed_actions: completedActions, critical_findings: criticalFindings, high_findings: highFindings, risk_score_avg: risks.length > 0 ? Math.round(risks.reduce((s, r) => s + (r.score ?? 0), 0) / risks.length) : 0, ai_summary_direction: directionSummary, ai_summary_technique: techniqueSummary },
      top_risks: risks.slice(0, 10).map(r => ({ title: r.title, level: r.risk_level, score: r.score, status: r.status, business_impact: r.business_impact })),
      priority_actions: actions.filter(a => a.status === "open").slice(0, 10).map(a => ({ title: a.title, priority: a.priority, type: a.action_type, expected_gain: a.expected_gain })),
      critical_findings: findings.filter(f => f.severity === "critical" || f.severity === "high").slice(0, 10).map(f => ({ title: f.title, severity: f.severity, type: f.finding_type, status: f.status })),
      ai_analyses_count: aiAnalyses.length,
    };

    const encoder = new TextEncoder();
    const reportBytes = encoder.encode(JSON.stringify(reportData));
    const hashBuffer = await crypto.subtle.digest("SHA-256", reportBytes);
    const reportHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");

    console.log(`export-sovereign-report: org=${organization_id} hash=${reportHash.slice(0, 16)}`);
    return new Response(JSON.stringify({ success: true, report: reportData, proof_hash: reportHash, sovereign_badge: "🇫🇷 Rapport souverain — SECURIT-E" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("export-sovereign-report fatal:", message);
    return new Response(JSON.stringify({ error: message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
