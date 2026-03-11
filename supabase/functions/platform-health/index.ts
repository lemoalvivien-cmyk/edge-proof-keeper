/**
 * CYBER SERENITY — platform-health Edge Function
 *
 * Returns a JSON health report:
 * - DB connectivity
 * - AI configuration status
 * - Table counts (sources, signals, risks, actions)
 * - No sensitive data exposed
 *
 * GET /functions/v1/platform-health
 * (optional) GET /functions/v1/platform-health?org_id=<uuid> for org-level data
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    const url = new URL(req.url);
    const orgId = url.searchParams.get("org_id");
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // ── DB connectivity check ─────────────────────────────────
    const db = createClient(supabaseUrl, serviceKey);
    let dbOk = false;
    try {
      const { error } = await db.from("organizations").select("id").limit(1);
      dbOk = !error;
    } catch {
      dbOk = false;
    }

    // ── AI config check ───────────────────────────────────────
    const aiConfigured = !!(
      Deno.env.get("LOVABLE_API_KEY") || Deno.env.get("GEMINI_API_KEY")
    );

    // ── Required tables check ─────────────────────────────────
    const requiredTables = [
      "data_sources", "source_sync_runs", "signals",
      "risk_register", "remediation_actions", "ai_analyses",
    ];
    const tableChecks: Record<string, boolean> = {};
    for (const table of requiredTables) {
      try {
        const { error } = await db.from(table as "data_sources").select("id").limit(1);
        tableChecks[table] = !error;
      } catch {
        tableChecks[table] = false;
      }
    }
    const allTablesOk = Object.values(tableChecks).every(Boolean);

    // ── Per-org counts (optional, requires auth) ──────────────
    let orgCounts: Record<string, number | null> = {};

    if (orgId && uuidRegex.test(orgId)) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const userClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const token = authHeader.replace("Bearer ", "");
        const { data: claimsData } = await userClient.auth.getClaims(token);
        if (claimsData?.claims) {
          const userId = claimsData.claims.sub;
          const { data: hasAccess } = await db.rpc("has_org_access", {
            _user_id: userId, _org_id: orgId,
          });
          if (hasAccess) {
            const [sources, signals, risks, actions] = await Promise.all([
              db.from("data_sources").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "active"),
              db.from("signals").select("id", { count: "exact", head: true }).eq("organization_id", orgId).in("status", ["new", "acknowledged"]),
              db.from("risk_register").select("id", { count: "exact", head: true }).eq("organization_id", orgId).eq("status", "open"),
              db.from("remediation_actions").select("id", { count: "exact", head: true }).eq("organization_id", orgId).in("status", ["open", "in_progress"]),
            ]);
            orgCounts = {
              active_sources: sources.count ?? 0,
              open_signals: signals.count ?? 0,
              open_risks: risks.count ?? 0,
              pending_actions: actions.count ?? 0,
            };
          }
        }
      }
    }

    const overallOk = dbOk && allTablesOk;

    const health = {
      status: overallOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      components: {
        database: { status: dbOk ? "ok" : "error" },
        ai_gateway: { status: aiConfigured ? "configured" : "not_configured" },
        tables: {
          status: allTablesOk ? "ok" : "incomplete",
          detail: tableChecks,
        },
      },
      ...(orgId && uuidRegex.test(orgId) && Object.keys(orgCounts).length > 0
        ? { org_counts: orgCounts }
        : {}),
    };

    console.log(`platform-health: status=${health.status} db=${dbOk} ai=${aiConfigured}`);

    return new Response(JSON.stringify(health), {
      status: overallOk ? 200 : 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("platform-health fatal error:", message);
    return new Response(
      JSON.stringify({ status: "error", error: message, timestamp: new Date().toISOString() }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
