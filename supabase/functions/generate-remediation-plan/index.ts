/**
 * CYBER SERENITY — generate-remediation-plan Edge Function
 *
 * Reads a risk from risk_register, builds a fact_pack,
 * calls Gemini server-side, inserts remediation_actions,
 * stores analysis in ai_analyses.
 *
 * POST /functions/v1/generate-remediation-plan
 * Body: { organization_id, risk_id }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callGemini, isConfigured, type RemediationPlanOutput } from "../_shared/gemini.ts";

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
    // ── Check AI configured ───────────────────────────────────
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

    // ── Parse & validate body ─────────────────────────────────
    let body: { organization_id?: string; risk_id?: string };
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { organization_id, risk_id } = body;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!organization_id || !uuidRegex.test(organization_id)) {
      return new Response(JSON.stringify({ error: "Invalid organization_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!risk_id || !uuidRegex.test(risk_id)) {
      return new Response(JSON.stringify({ error: "Invalid risk_id" }), {
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

    // ── Load risk ─────────────────────────────────────────────
    const { data: risk, error: riskError } = await db
      .from("risk_register")
      .select("*, assets(name, asset_type, identifier)")
      .eq("id", risk_id)
      .eq("organization_id", organization_id)
      .single();

    if (riskError || !risk) {
      return new Response(JSON.stringify({ error: "Risk not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Load linked signals (up to 10 for context) ────────────
    const signalIds: string[] = Array.isArray(risk.source_signal_ids)
      ? risk.source_signal_ids.slice(0, 10)
      : [];

    let linkedSignals: unknown[] = [];
    if (signalIds.length > 0) {
      const { data: sigs } = await db
        .from("signals")
        .select("title, description, severity, category, evidence")
        .in("id", signalIds);
      linkedSignals = sigs ?? [];
    }

    // ── Build fact_pack ───────────────────────────────────────
    const factPack = {
      risk_id: risk.id,
      risk_title: risk.title,
      risk_level: risk.risk_level,
      score: risk.score,
      description: risk.description,
      business_impact: risk.business_impact,
      technical_impact: risk.technical_impact,
      status: risk.status,
      asset: risk.assets
        ? { name: risk.assets.name, type: risk.assets.asset_type, identifier: risk.assets.identifier }
        : null,
      linked_signals: linkedSignals,
      signal_count: risk.source_signal_ids?.length ?? 0,
      analysis_context: "defensive_remediation_planning",
    };

    // ── Call Gemini ───────────────────────────────────────────
    console.log(`generate-remediation-plan: risk=${risk_id}`);
    const aiOutput = await callGemini("remediation_plan", factPack) as RemediationPlanOutput;

    // ── Insert remediation actions ────────────────────────────
    const actionsToInsert = (aiOutput.actions ?? []).map((action) => ({
      organization_id,
      risk_id,
      title: (action.title ?? "Untitled action").slice(0, 500),
      action_type: action.action_type ?? "process",
      priority: action.priority ?? "medium",
      status: "open",
      expected_gain: (action.expected_gain ?? "").slice(0, 2000),
      implementation_notes: (
        action.implementation_notes +
        (action.estimated_effort ? `\n\nEstimated effort: ${action.estimated_effort}` : "")
      ).slice(0, 5000),
    }));

    let insertedActions = 0;
    if (actionsToInsert.length > 0) {
      const { data: inserted, error: actionsError } = await db
        .from("remediation_actions")
        .insert(actionsToInsert)
        .select("id");
      if (actionsError) {
        console.error("remediation_actions insert error:", actionsError);
      } else {
        insertedActions = inserted?.length ?? 0;
      }
    }

    // ── Store AI analysis ─────────────────────────────────────
    const { data: analysis, error: analysisError } = await db
      .from("ai_analyses")
      .insert({
        organization_id,
        entity_type: "risk",
        entity_id: risk_id,
        model_name: "google/gemini-2.5-flash",
        analysis_type: "remediation_plan",
        prompt_version: "1.0",
        input_fact_pack: factPack,
        output_json: aiOutput,
      })
      .select("id")
      .single();

    if (analysisError) {
      console.error("ai_analyses insert error:", analysisError);
    }

    console.log(`generate-remediation-plan: risk=${risk_id} actions_created=${insertedActions}`);

    return new Response(
      JSON.stringify({
        success: true,
        risk_id,
        analysis_id: analysis?.id ?? null,
        actions_created: insertedActions,
        plan: {
          summary: aiOutput.summary,
          business_rationale: aiOutput.business_rationale,
          limitations: aiOutput.limitations,
          actions: aiOutput.actions,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("generate-remediation-plan fatal error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
