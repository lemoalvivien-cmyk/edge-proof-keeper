/**
 * CYBER SERENITY — analyze-risk-intelligence
 *
 * Enrichit un risque avec une couche d'intelligence IA défensive.
 * Lit les données réelles (risk + signals + entities), construit un fact pack strict,
 * appelle Gemini via le gateway Lovable, stocke le résultat dans ai_analyses.
 *
 * RÈGLES :
 * - Aucune action offensive
 * - Aucune invention de faits (fact pack = données DB réelles uniquement)
 * - Sortie JSON stricte via tool_calling
 * - Si Gemini absent → retour propre sans crash
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
const PROMPT_VERSION = "risk-intelligence-v1";

const SYSTEM_PROMPT = `You are a defensive cybersecurity analyst for Cyber Serenity.

STRICT RULES:
- You NEVER invent facts. All analysis is based ONLY on the provided fact_pack.
- You NEVER suggest offensive, intrusive, or unauthorized actions.
- You respond ONLY in the JSON format requested via tool_calling.
- If the fact_pack is insufficient, say so explicitly in the limitations field.
- Your tone is professional, precise, and directly actionable for a CISO or CTO.
- All text must be in French.`;

const RISK_INTELLIGENCE_TOOL = {
  type: "function",
  function: {
    name: "submit_risk_intelligence",
    description: "Submit the structured risk intelligence analysis",
    parameters: {
      type: "object",
      properties: {
        executive_summary: {
          type: "string",
          description: "Résumé exécutif du risque en 2-3 phrases, compréhensible par un DG/PDG",
        },
        business_impact: {
          type: "string",
          description: "Impact concret sur l'activité métier si le risque se matérialise",
        },
        technical_impact: {
          type: "string",
          description: "Impact technique précis (systèmes, données, services concernés)",
        },
        priority_rationale: {
          type: "string",
          description: "Justification de la priorité basée sur les signaux fournis",
        },
        confidence_assessment: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Niveau de confiance dans l'analyse basé sur la qualité des données",
        },
        recommended_next_steps: {
          type: "array",
          items: { type: "string" },
          description: "Liste ordonnée d'actions défensives concrètes et réalistes",
        },
      },
      required: [
        "executive_summary",
        "business_impact",
        "technical_impact",
        "priority_rationale",
        "confidence_assessment",
        "recommended_next_steps",
      ],
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
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Use anon key for user auth check
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

    // Use service role for data access
    const db = createClient(supabaseUrl, supabaseServiceKey);

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
      .select("*, assets:asset_id(name, asset_type, identifier, risk_level)")
      .eq("id", risk_id)
      .eq("organization_id", organization_id)
      .maybeSingle();

    if (riskErr || !risk) {
      return new Response(JSON.stringify({ error: "Risk not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Check for existing recent analysis ────────────────────────────────────
    const { data: existing } = await db
      .from("ai_analyses")
      .select("id, output_json, created_at")
      .eq("entity_id", risk_id)
      .eq("entity_type", "risk")
      .eq("analysis_type", "technical_analysis")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    // Return cached if < 1 hour old
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

    // ── Load signals ───────────────────────────────────────────────────────────
    const signalIds: string[] = Array.isArray(risk.source_signal_ids)
      ? risk.source_signal_ids
      : [];

    let signals: unknown[] = [];
    if (signalIds.length > 0) {
      const { data: signalData } = await db
        .from("signals")
        .select("id, title, description, severity, category, signal_type, confidence_score, detected_at, status")
        .in("id", signalIds.slice(0, 20)) // cap at 20 for fact pack size
        .eq("organization_id", organization_id);
      signals = signalData ?? [];
    }

    // ── Load entity links if available ────────────────────────────────────────
    let entities: unknown[] = [];
    if (signalIds.length > 0) {
      const { data: entityLinks } = await db
        .from("signal_entity_links")
        .select("relation_type, entity_nodes:entity_node_id(entity_type, canonical_value, display_value, confidence_score)")
        .in("signal_id", signalIds.slice(0, 10))
        .eq("organization_id", organization_id)
        .limit(30);
      entities = (entityLinks ?? []).map((l: Record<string, unknown>) => ({
        relation_type: l.relation_type,
        ...(l.entity_nodes as Record<string, unknown>),
      }));
    }

    // ── Build fact pack ───────────────────────────────────────────────────────
    const factPack = {
      risk: {
        id: risk.id,
        title: risk.title,
        description: risk.description,
        risk_level: risk.risk_level,
        score: risk.score,
        status: risk.status,
        owner: risk.owner,
        due_date: risk.due_date,
        business_impact: risk.business_impact,
        technical_impact: risk.technical_impact,
        source_signal_count: signalIds.length,
        asset: risk.assets
          ? {
              name: (risk.assets as Record<string, unknown>).name,
              asset_type: (risk.assets as Record<string, unknown>).asset_type,
              identifier: (risk.assets as Record<string, unknown>).identifier,
              risk_level: (risk.assets as Record<string, unknown>).risk_level,
            }
          : null,
      },
      signals: signals.slice(0, 15).map((s: unknown) => {
        const sig = s as Record<string, unknown>;
        return {
          title: sig.title,
          severity: sig.severity,
          category: sig.category,
          signal_type: sig.signal_type,
          confidence_score: sig.confidence_score,
          status: sig.status,
          detected_at: sig.detected_at,
        };
      }),
      entities: entities.slice(0, 20),
      context: {
        signal_count: signals.length,
        entity_count: entities.length,
        analysis_date: new Date().toISOString(),
      },
    };

    // ── Check Gemini availability ──────────────────────────────────────────────
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
    const userPrompt = `Analyse ce risque de cybersécurité et appelle l'outil submit_risk_intelligence avec ton analyse structurée.

FACT_PACK:
${JSON.stringify(factPack, null, 2)}

Règle absolue : base ton analyse UNIQUEMENT sur les faits fournis. Ne rien inventer.`;

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
        tools: [RISK_INTELLIGENCE_TOOL],
        tool_choice: { type: "function", function: { name: "submit_risk_intelligence" } },
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
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
        analysis_type: "technical_analysis",
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
    console.error("analyze-risk-intelligence error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
