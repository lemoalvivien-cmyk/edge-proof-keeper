/**
 * CYBER SERENITY — stale-risk-check Edge Function
 *
 * Detects stale/overdue risks and creates or updates alerts.
 * Purely defensive. No AI. Idempotent.
 *
 * POST /functions/v1/stale-risk-check
 * Body: { organization_id }
 *
 * Returns: { stale_risks_found, alerts_created, alerts_updated, errors_count }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Staleness thresholds (days without update)
const STALE_THRESHOLDS: Record<string, number> = {
  critical: 3,
  high: 7,
  medium: 30,
  low: 90,
};

// How many days overdue before an alert is created
const OVERDUE_DAYS = 0;

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

    // ── Load open risks ─────────────────────────────────────────────────────
    const { data: risks, error: riskError } = await db
      .from("risk_register")
      .select("id, title, risk_level, score, status, owner, due_date, updated_at, created_at")
      .eq("organization_id", organization_id)
      .in("status", ["open", "in_treatment"])
      .order("score", { ascending: false })
      .limit(500);

    if (riskError) {
      return new Response(JSON.stringify({ error: "Failed to load risks" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!risks || risks.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          stale_risks_found: 0,
          alerts_created: 0,
          alerts_updated: 0,
          errors_count: 0,
          message: "No open risks to evaluate",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Load existing open stale/overdue alerts for this org ────────────────
    const { data: existingAlerts } = await db
      .from("alerts")
      .select("id, source_entity_id, alert_type, status")
      .eq("organization_id", organization_id)
      .in("alert_type", ["stale_risk", "overdue_risk"])
      .eq("status", "open");

    // Build lookup: "entity_id::alert_type" → alert id
    const alertMap = new Map<string, string>();
    for (const a of existingAlerts ?? []) {
      const key = `${a.source_entity_id}::${a.alert_type}`;
      alertMap.set(key, a.id);
    }

    let staleRisksFound = 0;
    let alertsCreated = 0;
    let alertsUpdated = 0;
    let errorsCount = 0;

    const now = Date.now();

    for (const risk of risks) {
      const updatedAt = new Date(risk.updated_at ?? risk.created_at).getTime();
      const daysSinceUpdate = Math.floor((now - updatedAt) / (24 * 60 * 60 * 1000));
      const threshold = STALE_THRESHOLDS[risk.risk_level] ?? STALE_THRESHOLDS.medium;
      const isStale = daysSinceUpdate >= threshold;

      const dueDate = risk.due_date ? new Date(risk.due_date) : null;
      const daysUntilDue = dueDate
        ? Math.floor((dueDate.getTime() - now) / (24 * 60 * 60 * 1000))
        : null;
      const isOverdue = daysUntilDue !== null && daysUntilDue < OVERDUE_DAYS;

      if (!isStale && !isOverdue) continue;
      staleRisksFound++;

      // ── Stale risk alert ──────────────────────────────────────────────────
      if (isStale) {
        const alertType = "stale_risk";
        const key = `${risk.id}::${alertType}`;
        const existingId = alertMap.get(key);

        const alertData = {
          organization_id,
          alert_type: alertType,
          severity: risk.risk_level === "critical" ? "critical" : risk.risk_level === "high" ? "high" : "medium",
          title: `Risque stagnant : ${risk.title}`,
          description: `Ce risque ${risk.risk_level} n'a pas été mis à jour depuis ${daysSinceUpdate} jours (seuil : ${threshold} jours). Score : ${Math.round(risk.score)}.`,
          source_entity_type: "risk",
          source_entity_id: risk.id,
          last_detected_at: new Date().toISOString(),
        };

        try {
          if (existingId) {
            const { error } = await db
              .from("alerts")
              .update({ ...alertData, status: "open" })
              .eq("id", existingId);
            if (error) { errorsCount++; } else { alertsUpdated++; }
          } else {
            const { error } = await db.from("alerts").insert({
              ...alertData,
              status: "open",
              first_detected_at: new Date().toISOString(),
            });
            if (error) { errorsCount++; } else { alertsCreated++; }
          }
        } catch { errorsCount++; }
      }

      // ── Overdue risk alert ────────────────────────────────────────────────
      if (isOverdue) {
        const alertType = "overdue_risk";
        const key = `${risk.id}::${alertType}`;
        const existingId = alertMap.get(key);
        const overdueDays = Math.abs(daysUntilDue!);

        const alertData = {
          organization_id,
          alert_type: alertType,
          severity: risk.risk_level === "critical" ? "critical" : "high",
          title: `Risque en retard : ${risk.title}`,
          description: `Ce risque est en retard de ${overdueDays} jour(s). Échéance : ${risk.due_date}. Score : ${Math.round(risk.score)}.`,
          source_entity_type: "risk",
          source_entity_id: risk.id,
          last_detected_at: new Date().toISOString(),
        };

        try {
          if (existingId) {
            const { error } = await db
              .from("alerts")
              .update({ ...alertData, status: "open" })
              .eq("id", existingId);
            if (error) { errorsCount++; } else { alertsUpdated++; }
          } else {
            const { error } = await db.from("alerts").insert({
              ...alertData,
              status: "open",
              first_detected_at: new Date().toISOString(),
            });
            if (error) { errorsCount++; } else { alertsCreated++; }
          }
        } catch { errorsCount++; }
      }
    }

    console.log(
      `stale-risk-check: org=${organization_id} risks=${risks.length} stale=${staleRisksFound} created=${alertsCreated} updated=${alertsUpdated} errors=${errorsCount}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        stale_risks_found: staleRisksFound,
        alerts_created: alertsCreated,
        alerts_updated: alertsUpdated,
        errors_count: errorsCount,
        message: `${staleRisksFound} risque(s) stagnant(s) détecté(s) sur ${risks.length} évalués`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("stale-risk-check fatal error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
