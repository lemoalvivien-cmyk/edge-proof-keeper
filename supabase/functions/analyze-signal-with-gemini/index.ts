/**
 * CYBER SERENITY — analyze-signal-with-gemini Edge Function
 *
 * Reads a signal, builds a fact_pack, calls Gemini server-side,
 * stores the result in ai_analyses.
 *
 * POST /functions/v1/analyze-signal-with-gemini
 * Body: { organization_id, signal_id }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callGemini, isConfigured } from "../_shared/gemini.ts";

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
    // ── Check AI is configured ────────────────────────────────
    if (!isConfigured()) {
      return new Response(
        JSON.stringify({ error: "AI not configured — LOVABLE_API_KEY or GEMINI_API_KEY required" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Auth ──────────────────────────────────────────────────
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

    // ── Parse body ────────────────────────────────────────────
    let body: { organization_id?: string; signal_id?: string };
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { organization_id, signal_id } = body;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!organization_id || !uuidRegex.test(organization_id)) {
      return new Response(JSON.stringify({ error: "Invalid organization_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!signal_id || !uuidRegex.test(signal_id)) {
      return new Response(JSON.stringify({ error: "Invalid signal_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const db = createClient(supabaseUrl, serviceKey);

    // ── Check org access ──────────────────────────────────────
    const { data: hasAccess } = await db.rpc("has_org_access", {
      _user_id: userId, _org_id: organization_id,
    });
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Load signal ───────────────────────────────────────────
    const { data: signal, error: sigError } = await db
      .from("signals")
      .select("*, data_sources(name, source_type, category), assets(name, asset_type, identifier)")
      .eq("id", signal_id)
      .eq("organization_id", organization_id)
      .single();

    if (sigError || !signal) {
      return new Response(JSON.stringify({ error: "Signal not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Build fact_pack (no sensitive config, no raw payloads unless needed) ───
    const factPack = {
      signal_id: signal.id,
      signal_type: signal.signal_type,
      category: signal.category,
      title: signal.title,
      description: signal.description,
      severity: signal.severity,
      confidence_score: signal.confidence_score,
      detected_at: signal.detected_at,
      evidence: signal.evidence,
      source: signal.data_sources
        ? { name: signal.data_sources.name, type: signal.data_sources.source_type }
        : null,
      asset: signal.assets
        ? { name: signal.assets.name, type: signal.assets.asset_type, identifier: signal.assets.identifier }
        : null,
      analysis_context: "defensive_security_assessment",
    };

    // ── Call Gemini ───────────────────────────────────────────
    console.log(`analyze-signal-with-gemini: analyzing signal=${signal_id}`);
    const aiOutput = await callGemini("technical_analysis", factPack);

    // ── Store analysis ────────────────────────────────────────
    const { data: analysis, error: insertError } = await db
      .from("ai_analyses")
      .insert({
        organization_id,
        entity_type: "signal",
        entity_id: signal_id,
        model_name: "google/gemini-2.5-flash",
        analysis_type: "technical_analysis",
        prompt_version: "1.0",
        input_fact_pack: factPack,
        output_json: aiOutput,
      })
      .select("id, created_at")
      .single();

    if (insertError) {
      console.error("ai_analyses insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to store analysis" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis_id: analysis.id,
        signal_id,
        analysis: aiOutput,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("analyze-signal-with-gemini fatal error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
