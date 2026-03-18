/**
 * SECURIT-E — build-remediation-queue Edge Function
 * Rate limiting RÉEL via DB (stateless-safe).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders, handleCors } from "../_shared/cors.ts";

interface ActionTemplate {
  title: string;
  action_type: "patch" | "config" | "process" | "monitoring" | "accept";
  priority: "critical" | "high" | "medium" | "low";
  due_days: number;
  expected_gain: string;
  implementation_notes: string;
}

function getTemplates(riskLevel: string): ActionTemplate[] {
  switch (riskLevel) {
    case "critical": return [{ title: "Patch d'urgence — corriger la vulnérabilité critique", action_type: "patch", priority: "critical", due_days: 2, expected_gain: "Élimination du vecteur d'attaque critique", implementation_notes: "Appliquer le correctif dès que disponible. Tester en staging avant production." }, { title: "Isolation temporaire de l'actif exposé", action_type: "config", priority: "critical", due_days: 1, expected_gain: "Réduction immédiate de la surface d'exposition", implementation_notes: "Restreindre l'accès réseau jusqu'à application du correctif." }];
    case "high": return [{ title: "Corriger la vulnérabilité élevée", action_type: "patch", priority: "high", due_days: 7, expected_gain: "Suppression d'un risque d'exploitation significatif", implementation_notes: "Prioriser dans le prochain sprint. Valider avec l'équipe sécurité." }, { title: "Renforcer la configuration de sécurité", action_type: "config", priority: "high", due_days: 7, expected_gain: "Réduction de la surface d'attaque", implementation_notes: "Revoir les paramètres selon les benchmarks CIS/NIST." }];
    case "medium": return [{ title: "Planifier et appliquer le correctif", action_type: "patch", priority: "medium", due_days: 30, expected_gain: "Élimination du risque dans le prochain cycle de maintenance", implementation_notes: "Inclure dans la planification mensuelle de sécurité." }, { title: "Améliorer la surveillance de l'actif", action_type: "monitoring", priority: "medium", due_days: 14, expected_gain: "Détection précoce d'une éventuelle exploitation", implementation_notes: "Configurer des alertes spécifiques pour les indicateurs de compromission." }];
    default: return [{ title: "Documenter et planifier la remédiation", action_type: "process", priority: "low", due_days: 90, expected_gain: "Réduction du risque résiduel à long terme", implementation_notes: "Intégrer au processus de gestion des risques." }];
  }
}

function addDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  const corsHeaders = buildCorsHeaders(req);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const userId = claimsData.claims.sub;

    let body: { organization_id?: string };
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { organization_id } = body;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!organization_id || !uuidRegex.test(organization_id)) {
      return new Response(JSON.stringify({ error: "Invalid or missing organization_id" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const db = createClient(supabaseUrl, serviceKey);

    // ── Rate limit RÉEL via DB ────────────────────────────────────────────────
    const { data: allowed, error: rlErr } = await db.rpc("check_rate_limit", {
      p_user_id: userId,
      p_function_name: "build-remediation-queue",
      p_max_per_minute: 10,
    });
    if (rlErr) console.error("build-remediation-queue rate limit error:", rlErr.message);
    if (allowed === false) {
      return new Response(JSON.stringify({ error: "Limite de 10 appels/min atteinte" }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" }
      });
    }

    const { data: hasAccess } = await db.rpc("has_org_access", { _user_id: userId, _org_id: organization_id });
    if (!hasAccess) return new Response(JSON.stringify({ error: "Access denied" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: risks, error: riskError } = await db.from("risk_register").select("id, title, risk_level, score, status").eq("organization_id", organization_id).in("status", ["open", "in_treatment"]).order("score", { ascending: false }).limit(200);
    if (riskError) return new Response(JSON.stringify({ error: "Failed to load risks" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!risks || risks.length === 0) return new Response(JSON.stringify({ success: true, risks_processed: 0, actions_created: 0, actions_updated: 0, errors_count: 0, message: "No open risks to process" }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const riskIds = risks.map((r) => r.id);
    const { data: existingActions } = await db.from("remediation_actions").select("id, risk_id, title, action_type, status").eq("organization_id", organization_id).in("risk_id", riskIds).in("status", ["open", "in_progress"]);
    const existingMap = new Map<string, string>();
    for (const a of existingActions ?? []) { existingMap.set(`${a.risk_id}::${a.action_type}::${a.title}`, a.id); }

    let actionsCreated = 0, actionsUpdated = 0, errorsCount = 0;

    for (const risk of risks) {
      const templates = getTemplates(risk.risk_level);
      for (const tpl of templates) {
        const key = `${risk.id}::${tpl.action_type}::${tpl.title}`;
        const existingId = existingMap.get(key);
        if (existingId) {
          const { error } = await db.from("remediation_actions").update({ priority: tpl.priority, expected_gain: tpl.expected_gain, implementation_notes: tpl.implementation_notes }).eq("id", existingId);
          if (error) { console.error(`update error for action ${existingId}:`, error.message); errorsCount++; } else { actionsUpdated++; }
        } else {
          const { error } = await db.from("remediation_actions").insert({ organization_id, risk_id: risk.id, title: tpl.title, action_type: tpl.action_type, priority: tpl.priority, status: "open", due_date: addDays(tpl.due_days), expected_gain: tpl.expected_gain, implementation_notes: tpl.implementation_notes, owner: null });
          if (error) { console.error(`insert error for risk ${risk.id}:`, error.message); errorsCount++; } else { actionsCreated++; }
        }
      }
    }

    console.log(`build-remediation-queue: org=${organization_id} risks=${risks.length} created=${actionsCreated} updated=${actionsUpdated} errors=${errorsCount}`);
    return new Response(JSON.stringify({ success: true, risks_processed: risks.length, actions_created: actionsCreated, actions_updated: actionsUpdated, errors_count: errorsCount }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: unknown) {
    console.error("build-remediation-queue fatal error:", err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
