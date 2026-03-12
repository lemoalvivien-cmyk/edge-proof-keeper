/**
 * CYBER SERENITY — evaluate-alert-rules Edge Function
 *
 * Reads notification_rules and open alerts, evaluates which alerts
 * match rule thresholds, and produces a notification summary.
 * Simple, defensive, no external calls.
 *
 * POST /functions/v1/evaluate-alert-rules
 * Body: { organization_id }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SEVERITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey     = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    // ── Auth ────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // ── Parse body ──────────────────────────────────────────────────────────
    let body: { organization_id?: string };
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { organization_id } = body;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!organization_id || !uuidRegex.test(organization_id)) {
      return new Response(JSON.stringify({ error: "Invalid or missing organization_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const db = createClient(supabaseUrl, serviceKey);

    // ── Verify org access ───────────────────────────────────────────────────
    const { data: hasAccess } = await db.rpc("has_org_access", {
      _user_id: userId,
      _org_id: organization_id,
    });
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Load enabled notification rules ─────────────────────────────────────
    const { data: rules, error: rulesError } = await db
      .from("notification_rules")
      .select("id, rule_type, severity_threshold, channel, config")
      .eq("organization_id", organization_id)
      .eq("is_enabled", true)
      .limit(100);

    if (rulesError) {
      return new Response(JSON.stringify({ error: "Failed to load notification rules" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Load open alerts ────────────────────────────────────────────────────
    const { data: alerts, error: alertsError } = await db
      .from("alerts")
      .select("id, alert_type, severity, title, description, source_entity_type, source_entity_id, first_detected_at, last_detected_at")
      .eq("organization_id", organization_id)
      .eq("status", "open")
      .order("last_detected_at", { ascending: false })
      .limit(200);

    if (alertsError) {
      return new Response(JSON.stringify({ error: "Failed to load alerts" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const openAlerts = alerts ?? [];

    // ── If no rules configured, return summary with defaults ─────────────────
    if (!rules || rules.length === 0) {
      const criticalCount = openAlerts.filter((a) => a.severity === "critical").length;
      const highCount     = openAlerts.filter((a) => a.severity === "high").length;

      return new Response(
        JSON.stringify({
          success: true,
          rules_evaluated: 0,
          alerts_matched: criticalCount + highCount,
          notifications_to_send: criticalCount + highCount,
          open_alerts_count: openAlerts.length,
          summary: {
            critical: criticalCount,
            high: highCount,
            medium: openAlerts.filter((a) => a.severity === "medium").length,
            low: openAlerts.filter((a) => a.severity === "low").length,
          },
          matched_alerts: openAlerts
            .filter((a) => a.severity === "critical" || a.severity === "high")
            .slice(0, 20)
            .map((a) => ({
              id: a.id,
              title: a.title,
              severity: a.severity,
              alert_type: a.alert_type,
            })),
          message: "Aucune règle configurée — résumé par défaut (critique + élevé)",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Evaluate rules against alerts ───────────────────────────────────────
    let alertsMatched = 0;
    const matchedAlerts: Array<{ id: string; title: string; severity: string; alert_type: string; matched_rule: string }> = [];

    for (const rule of rules) {
      const thresholdLevel = SEVERITY_ORDER[rule.severity_threshold ?? "medium"] ?? SEVERITY_ORDER.medium;

      const matching = openAlerts.filter((a) => {
        const alertLevel = SEVERITY_ORDER[a.severity] ?? 0;
        return alertLevel >= thresholdLevel;
      });

      alertsMatched += matching.length;
      for (const a of matching.slice(0, 10)) {
        matchedAlerts.push({
          id: a.id,
          title: a.title,
          severity: a.severity,
          alert_type: a.alert_type,
          matched_rule: rule.rule_type,
        });
      }
    }

    const criticalCount = openAlerts.filter((a) => a.severity === "critical").length;
    const highCount     = openAlerts.filter((a) => a.severity === "high").length;

    console.log(
      `evaluate-alert-rules: org=${organization_id} rules=${rules.length} alerts=${openAlerts.length} matched=${alertsMatched}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        rules_evaluated: rules.length,
        alerts_matched: alertsMatched,
        notifications_to_send: alertsMatched,
        open_alerts_count: openAlerts.length,
        summary: {
          critical: criticalCount,
          high: highCount,
          medium: openAlerts.filter((a) => a.severity === "medium").length,
          low: openAlerts.filter((a) => a.severity === "low").length,
        },
        matched_alerts: matchedAlerts.slice(0, 20),
        message: `${rules.length} règle(s) évaluée(s) — ${alertsMatched} alerte(s) correspondante(s)`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("evaluate-alert-rules fatal error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
