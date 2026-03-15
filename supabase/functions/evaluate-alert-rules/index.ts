/**
 * CYBER SERENITY — evaluate-alert-rules Edge Function
 *
 * Reads notification_rules and open alerts, evaluates which alerts
 * match rule thresholds, and dispatches webhook notifications (Slack/Teams).
 *
 * Supported channels:
 *   - in_app   : no external call (frontend polls)
 *   - slack    : POST to config.webhook_url (Slack Incoming Webhook)
 *   - teams    : POST to config.webhook_url (Teams Incoming Webhook)
 *   - webhook  : generic POST to config.url with config.headers
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

// ── Webhook dispatcher ──────────────────────────────────────────────────────

interface AlertSummaryItem {
  id: string;
  title: string;
  severity: string;
  alert_type: string;
  matched_rule?: string;
}

interface NotificationRule {
  id: string;
  rule_type: string;
  severity_threshold: string | null;
  channel: string;
  config: Record<string, unknown>;
}

// ── URL validation to prevent SSRF ─────────────────────────────────────────
function validateWebhookUrl(rawUrl: string): { ok: boolean; error?: string } {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { ok: false, error: "Invalid URL format" };
  }
  if (parsed.protocol !== "https:") {
    return { ok: false, error: "Only HTTPS webhook URLs are allowed" };
  }
  const hostname = parsed.hostname.toLowerCase();
  // Block loopback
  if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
    return { ok: false, error: "Loopback addresses are not allowed" };
  }
  // Block link-local (AWS metadata, etc.)
  if (hostname.startsWith("169.254.")) {
    return { ok: false, error: "Link-local addresses are not allowed" };
  }
  // Block RFC-1918 private ranges
  const privateRanges = [/^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./];
  for (const re of privateRanges) {
    if (re.test(hostname)) {
      return { ok: false, error: "Private IP ranges are not allowed" };
    }
  }
  return { ok: true };
}

async function dispatchWebhook(
  rule: NotificationRule,
  matchedAlerts: AlertSummaryItem[],
  orgId: string
): Promise<{ dispatched: boolean; error?: string }> {
  const { channel, config } = rule;
  if (!matchedAlerts.length) return { dispatched: false };

  const criticalCount = matchedAlerts.filter(a => a.severity === "critical").length;
  const highCount     = matchedAlerts.filter(a => a.severity === "high").length;

  try {
    // ── Slack Incoming Webhook ──────────────────────────────────────────────
    if (channel === "slack") {
      const webhookUrl = config?.webhook_url as string | undefined;
      if (!webhookUrl) return { dispatched: false, error: "slack: missing webhook_url in config" };

      const urlCheck = validateWebhookUrl(webhookUrl);
      if (!urlCheck.ok) {
        console.warn(`dispatchWebhook [slack] blocked: ${urlCheck.error}`);
        return { dispatched: false, error: `slack: ${urlCheck.error}` };
      }

      const color = criticalCount > 0 ? "danger" : highCount > 0 ? "warning" : "good";
      const text  = `🚨 *Securit-E — ${matchedAlerts.length} alerte(s) active(s)*\n` +
        `Critique: ${criticalCount} · Élevé: ${highCount} · Org: ${orgId.slice(0, 8)}…\n` +
        matchedAlerts.slice(0, 5).map(a => `• [${a.severity.toUpperCase()}] ${a.title}`).join("\n");

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          attachments: [{
            color,
            fields: matchedAlerts.slice(0, 5).map(a => ({
              title: a.title,
              value: `Sévérité: ${a.severity} · Type: ${a.alert_type}`,
              short: true,
            })),
          }],
        }),
      });
      return { dispatched: true };
    }

    // ── Teams Incoming Webhook ──────────────────────────────────────────────
    if (channel === "teams") {
      const webhookUrl = config?.webhook_url as string | undefined;
      if (!webhookUrl) return { dispatched: false, error: "teams: missing webhook_url in config" };

      const urlCheck = validateWebhookUrl(webhookUrl);
      if (!urlCheck.ok) {
        console.warn(`dispatchWebhook [teams] blocked: ${urlCheck.error}`);
        return { dispatched: false, error: `teams: ${urlCheck.error}` };
      }

      const themeColor = criticalCount > 0 ? "FF0000" : highCount > 0 ? "FFA500" : "28a745";
      const facts = matchedAlerts.slice(0, 5).map(a => ({
        name: a.title,
        value: `${a.severity.toUpperCase()} — ${a.alert_type}`,
      }));

      await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          "@type": "MessageCard",
          "@context": "http://schema.org/extensions",
          themeColor,
          summary: `Sentinel Immune — ${matchedAlerts.length} alerte(s)`,
          sections: [{
            activityTitle: `🚨 ${matchedAlerts.length} alerte(s) active(s) · ${criticalCount} critique(s)`,
            activitySubtitle: `Organisation: ${orgId.slice(0, 8)}…`,
            facts,
          }],
        }),
      });
      return { dispatched: true };
    }

    // ── Generic Webhook ─────────────────────────────────────────────────────
    if (channel === "webhook") {
      const url = config?.url as string | undefined;
      if (!url) return { dispatched: false, error: "webhook: missing url in config" };

      const urlCheck = validateWebhookUrl(url);
      if (!urlCheck.ok) {
        console.warn(`dispatchWebhook [webhook] blocked: ${urlCheck.error}`);
        return { dispatched: false, error: `webhook: ${urlCheck.error}` };
      }

      const extraHeaders = (config?.headers as Record<string, string> | undefined) ?? {};
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...extraHeaders },
        body: JSON.stringify({
          event: "alerts_matched",
          organization_id: orgId,
          matched_count: matchedAlerts.length,
          critical_count: criticalCount,
          high_count: highCount,
          alerts: matchedAlerts.slice(0, 20),
          rule_type: rule.rule_type,
          timestamp: new Date().toISOString(),
        }),
      });
      return { dispatched: true };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown dispatch error";
    console.warn(`dispatchWebhook [${channel}] error:`, msg);
    return { dispatched: false, error: msg };
  }
}

// ── Main handler ────────────────────────────────────────────────────────────

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
    const criticalCount = openAlerts.filter((a) => a.severity === "critical").length;
    const highCount     = openAlerts.filter((a) => a.severity === "high").length;

    // ── If no rules configured, return summary with defaults ─────────────────
    if (!rules || rules.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          rules_evaluated: 0,
          alerts_matched: criticalCount + highCount,
          notifications_to_send: criticalCount + highCount,
          notifications_dispatched: 0,
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

    // ── Evaluate rules against alerts + dispatch webhooks ───────────────────
    let alertsMatched = 0;
    let notificationsDispatched = 0;
    const matchedAlerts: AlertSummaryItem[] = [];
    const dispatchErrors: string[] = [];

    for (const rule of rules) {
      const thresholdLevel = SEVERITY_ORDER[rule.severity_threshold ?? "medium"] ?? SEVERITY_ORDER.medium;

      const matching = openAlerts.filter((a) => {
        const alertLevel = SEVERITY_ORDER[a.severity] ?? 0;
        return alertLevel >= thresholdLevel;
      });

      alertsMatched += matching.length;

      const ruleMatched: AlertSummaryItem[] = matching.slice(0, 20).map(a => ({
        id: a.id,
        title: a.title,
        severity: a.severity,
        alert_type: a.alert_type,
        matched_rule: rule.rule_type,
      }));
      matchedAlerts.push(...ruleMatched);

      // Dispatch webhook if channel requires it
      if (rule.channel !== "in_app" && ruleMatched.length > 0) {
        const dispatchResult = await dispatchWebhook(
          rule as NotificationRule,
          ruleMatched,
          organization_id
        );
        if (dispatchResult.dispatched) {
          notificationsDispatched++;
        } else if (dispatchResult.error) {
          dispatchErrors.push(`[${rule.channel}] ${dispatchResult.error}`);
        }
      }
    }

    console.log(
      `evaluate-alert-rules: org=${organization_id} rules=${rules.length} alerts=${openAlerts.length} matched=${alertsMatched} dispatched=${notificationsDispatched}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        rules_evaluated: rules.length,
        alerts_matched: alertsMatched,
        notifications_to_send: alertsMatched,
        notifications_dispatched: notificationsDispatched,
        dispatch_errors: dispatchErrors.length > 0 ? dispatchErrors : undefined,
        open_alerts_count: openAlerts.length,
        summary: {
          critical: criticalCount,
          high: highCount,
          medium: openAlerts.filter((a) => a.severity === "medium").length,
          low: openAlerts.filter((a) => a.severity === "low").length,
        },
        matched_alerts: matchedAlerts.slice(0, 20),
        message: `${rules.length} règle(s) évaluée(s) — ${alertsMatched} alerte(s) correspondante(s) · ${notificationsDispatched} webhook(s) envoyé(s)`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("evaluate-alert-rules fatal error:", err instanceof Error ? err.message : err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
