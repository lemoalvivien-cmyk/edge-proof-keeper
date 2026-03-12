/**
 * CYBER SERENITY — schedule-source-sync Edge Function
 *
 * Reads active/configured data sources and triggers a sync for each.
 * Defensive, idempotent, multi-tenant strict.
 *
 * POST /functions/v1/schedule-source-sync
 * Body: { organization_id }
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

    // ── Load active/configured sources ──────────────────────────────────────
    const { data: sources, error: sourcesError } = await db
      .from("data_sources")
      .select("id, name, source_type, category, status, last_sync_at")
      .eq("organization_id", organization_id)
      .in("status", ["active", "not_configured"])
      .order("last_sync_at", { ascending: true, nullsFirst: true })
      .limit(50);

    if (sourcesError) {
      return new Response(JSON.stringify({ error: "Failed to load sources" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!sources || sources.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          sources_considered: 0,
          syncs_triggered: 0,
          errors_count: 0,
          message: "No active sources found",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Determine which sources need sync ───────────────────────────────────
    // Only re-sync sources that haven't been synced in the last 6 hours
    const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
    const now = Date.now();
    const sourcesToSync = sources.filter((s) => {
      if (!s.last_sync_at) return true; // Never synced
      return now - new Date(s.last_sync_at).getTime() > SIX_HOURS_MS;
    });

    let syncsTriggered = 0;
    let errorsCount = 0;

    // ── Trigger sync for each eligible source ───────────────────────────────
    for (const source of sourcesToSync) {
      try {
        // Create a pending sync run to signal intent
        const { error: insertError } = await db.from("source_sync_runs").insert({
          organization_id,
          source_id: source.id,
          status: "pending",
          started_at: new Date().toISOString(),
          items_received: 0,
          items_normalized: 0,
          raw_summary: {
            triggered_by: "schedule-source-sync",
            source_type: source.source_type,
            source_category: source.category,
          },
        });

        if (insertError) {
          console.error(`schedule-source-sync: insert sync_run error for source ${source.id}:`, insertError.message);
          errorsCount++;
          continue;
        }

        // Mark source as being synced
        await db
          .from("data_sources")
          .update({ last_sync_at: new Date().toISOString() })
          .eq("id", source.id)
          .eq("organization_id", organization_id);

        syncsTriggered++;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        console.error(`schedule-source-sync: error for source ${source.id}:`, msg);
        errorsCount++;
      }
    }

    console.log(
      `schedule-source-sync: org=${organization_id} considered=${sources.length} triggered=${syncsTriggered} errors=${errorsCount}`
    );

    return new Response(
      JSON.stringify({
        success: true,
        sources_considered: sources.length,
        syncs_triggered: syncsTriggered,
        errors_count: errorsCount,
        message: `${syncsTriggered} sync(s) planifié(s) sur ${sources.length} sources évaluées`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("schedule-source-sync fatal error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
