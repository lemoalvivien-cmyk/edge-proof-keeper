/**
 * CYBER SERENITY — enhance-remediation-actions
 *
 * Enrichit les actions de remédiation d'un risque via IA.
 * Lit risque + actions existantes, construit un fact pack strict,
 * appelle Gemini, enrichit chaque action avec business_justification,
 * implementation_notes détaillées, expected_gain, et execution_order.
 *
 * RÈGLES :
 * - Purement défensif
 * - Aucune hallucination
 * - Idempotent (met à jour, ne duplique pas)
 * - Stocké dans ai_analyses
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version",
};

const LOVABLE_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";
const PROMPT_VERSION = "enhance-remediation-v1";

const SYSTEM_PROMPT = `You are a defensive cybersecurity remediation expert for Cyber Serenity.

STRICT RULES:
- You NEVER invent facts. All recommendations are based ONLY on the provided fact_pack.
- You NEVER suggest offensive, intrusive, or unauthorized actions.
- You ONLY recommend legally authorized, defensive remediations.
- You respond ONLY in the JSON format requested via tool_calling.
- Each action must have a clear business justification and concrete implementation steps.
- Prioritize based on impact, feasibility, and urgency.
- All text must be in French.`;

const ENHANCE_REMEDIATION_TOOL = {
  type: "function",
  function: {
    name: "submit_enhanced_remediation",
    description: "Submit the enriched remediation plan for the risk",
    parameters: {
      type: "object",
      properties: {
        overall_strategy: {
          type: "string",
          description: "Stratégie globale de remédiation en 2-3 phrases",
        },
        actions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              original_title: {
                type: "string",
                description: "Titre original de l'action (pour correspondance)",
              },
              business_justification: {
                type: "string",
                description: "Pourquoi cette action est critique pour l'activité",
              },
              implementation_notes: {
                type: "string",
                description: "Étapes concrètes et techniques pour implémenter cette action",
              },
              expected_gain: {
                type: "string",
                description: "Gain attendu mesurable (réduction de risque, protection de données, etc.)",
              },
              execution_order: {
                type: "number",
                description: "Ordre d'exécution recommandé (1 = premier à faire)",
              },
              estimated_effort: {
                type: "string",
                description: "Effort estimé (ex: 2h, 1 journée, 1 semaine)",
              },
            },
            required: [
              "original_title",
              "business_justification",
              "implementation_notes",
              "expected_gain",
              "execution_order",
              "estimated_effort",
            ],
            additionalProperties: false,
          },
          description: "Actions enrichies, ordonnées par priorité d'exécution",
        },
        total_effort_estimate: {
          type: "string",
          description: "Estimation totale de l'effort pour toutes les actions",
        },
        limitations: {
          type: "string",
          description: "Ce qui manque pour affiner ce plan de remédiation",
        },
      },
      required: ["overall_strategy", "actions", "total_effort_estimate", "limitations"],
      additionalProperties: false,
    },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabaseAnon.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const db = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // ── Input ─────────────────────────────────────────────────────────────────
    const { risk_id, organization_id } = await req.json();
    if (!risk_id || !organization_id) {
      return new Response(JSON.stringify({ error: "risk_id and organization_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Load risk ─────────────────────────────────────────────────────────────
    const { data: risk, error: riskErr } = await db
      .from("risk_register")
      .select("*")
      .eq("id", risk_id)
      .eq("organization_id", organization_id)
      .maybeSingle();

    if (riskErr || !risk) {
      return new Response(JSON.stringify({ error: "Risk not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Load remediation actions ───────────────────────────────────────────────
    const { data: actions, error: actionsErr } = await db
      .from("remediation_actions")
      .select("id, title, action_type, priority, status, expected_gain, implementation_notes")
      .eq("risk_id", risk_id)
      .eq("organization_id", organization_id)
      .order("priority", { ascending: false })
      .limit(20);

    if (actionsErr) {
      throw new Error(`Failed to load actions: ${actionsErr.message}`);
    }

    if (!actions || actions.length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No remediation actions found for this risk. Run build-remediation-queue first.",
          risk_id,
        }),
        { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Check for recent cached analysis ─────────────────────────────────────
    const { data: existing } = await db
      .from("ai_analyses")
      .select("id, output_json, created_at")
      .eq("entity_id", risk_id)
      .eq("entity_type", "risk")
      .eq("analysis_type", "remediation_plan")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      const age = Date.now() - new Date(existing.created_at).getTime();
      if (age < 3600_000) {
        return new Response(
          JSON.stringify({
            success: true,
            analysis_id: existing.id,
            risk_id,
            result: existing.output_json,
            cached: true,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // ── Build fact pack ───────────────────────────────────────────────────────
    const factPack = {
      risk: {
        title: risk.title,
        description: risk.description,
        risk_level: risk.risk_level,
        score: risk.score,
        business_impact: risk.business_impact,
        technical_impact: risk.technical_impact,
        status: risk.status,
        due_date: risk.due_date,
        source_signal_count: Array.isArray(risk.source_signal_ids)
          ? risk.source_signal_ids.length
          : 0,
      },
      actions: actions.map((a: Record<string, unknown>) => ({
        id: a.id,
        title: a.title,
        action_type: a.action_type,
        priority: a.priority,
        status: a.status,
        current_expected_gain: a.expected_gain || "",
        current_implementation_notes: a.implementation_notes || "",
      })),
      context: {
        action_count: actions.length,
        analysis_date: new Date().toISOString(),
      },
    };

    // ── Check Gemini ──────────────────────────────────────────────────────────
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "AI gateway not configured",
          ai_available: false,
          risk_id,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Call Gemini ───────────────────────────────────────────────────────────
    const userPrompt = `Enrichis le plan de remédiation de ce risque et appelle l'outil submit_enhanced_remediation.

FACT_PACK:
${JSON.stringify(factPack, null, 2)}

Règle absolue : base ton analyse UNIQUEMENT sur les faits fournis. Enrichis les ${actions.length} actions existantes, ne crée pas de nouvelles.`;

    const aiResponse = await fetch(LOVABLE_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [ENHANCE_REMEDIATION_TOOL],
        tool_choice: { type: "function", function: { name: "submit_enhanced_remediation" } },
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "AI rate limit exceeded — retry later", risk_id }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI credits exhausted", risk_id }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      throw new Error(`AI gateway error ${aiResponse.status}: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("AI returned no structured output");
    }

    const result = JSON.parse(toolCall.function.arguments);

    // ── Store in ai_analyses ──────────────────────────────────────────────────
    const { data: stored, error: storeErr } = await db
      .from("ai_analyses")
      .insert({
        organization_id,
        entity_type: "risk",
        entity_id: risk_id,
        model_name: MODEL,
        analysis_type: "remediation_plan",
        prompt_version: PROMPT_VERSION,
        input_fact_pack: factPack,
        output_json: result,
      })
      .select("id")
      .single();

    if (storeErr) {
      console.error("Failed to store analysis:", storeErr.message);
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis_id: stored?.id ?? null,
        risk_id,
        result,
        cached: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("enhance-remediation-actions error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
