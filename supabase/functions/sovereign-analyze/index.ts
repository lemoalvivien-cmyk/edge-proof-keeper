/**
 * SECURIT-E — sovereign-analyze Edge Function
 *
 * Agent IA souverain français — CISO IA NIS2/GDPR
 * Rate limiting RÉEL via table rate_limits (DB-backed, stateless-safe).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders, handleCors } from "../_shared/cors.ts";

const LOVABLE_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

const SOVEREIGN_SYSTEM_PROMPT = `Tu es un CISO (Chief Information Security Officer) français souverain, expert en cybersécurité défensive.

RÈGLES ABSOLUES :
- Tu analyses UNIQUEMENT sous le prisme NIS2 (Directive EU 2022/2555) et RGPD (Règlement UE 2016/679).
- Tu ne donnes JAMAIS d'instructions offensives, d'exploits ou de techniques d'attaque.
- Tu réponds TOUJOURS en français clair, professionnel et actionnable.
- Tes analyses sont basées UNIQUEMENT sur les faits fournis dans le fact_pack.
- Tu identifies les obligations légales, les risques de non-conformité et les sanctions potentielles.
- Tu proposes des remédiations concrètes, réalistes et prioritaires.
- Tu cites les articles NIS2/RGPD pertinents quand applicable.
- Si les données sont insuffisantes, tu le dis explicitement.
- Ton ton est celui d'un RSSI senior : précis, sans jargon inutile, orienté métier.

FORMAT : Tu réponds en JSON structuré via tool_calling uniquement.`;

const ANALYSIS_TOOL = {
  type: "function",
  function: {
    name: "submit_sovereign_analysis",
    description: "Soumet l'analyse souveraine structurée NIS2/RGPD",
    parameters: {
      type: "object",
      properties: {
        titre: { type: "string", description: "Titre court de l'analyse (max 100 caractères)" },
        niveau_risque: { type: "string", enum: ["critique", "élevé", "moyen", "faible"] },
        analyse_technique: { type: "string" },
        conformite_nis2: { type: "string" },
        conformite_rgpd: { type: "string" },
        impact_metier: { type: "string" },
        actions_prioritaires: {
          type: "array",
          items: {
            type: "object",
            properties: {
              ordre: { type: "number" },
              action: { type: "string" },
              urgence: { type: "string", enum: ["immédiat", "24h", "7_jours", "30_jours"] },
              responsable: { type: "string" },
              effort: { type: "string" }
            },
            required: ["ordre", "action", "urgence", "responsable", "effort"],
            additionalProperties: false
          }
        },
        script_healing: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["bash", "powershell", "none"] },
            script: { type: "string" },
            description: { type: "string" }
          },
          required: ["type", "script", "description"],
          additionalProperties: false
        },
        limites: { type: "string" }
      },
      required: ["titre", "niveau_risque", "analyse_technique", "conformite_nis2", "conformite_rgpd", "impact_metier", "actions_prioritaires", "script_healing", "limites"],
      additionalProperties: false
    }
  }
};

Deno.serve(async (req) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  const corsHeaders = buildCorsHeaders(req);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

  if (!lovableKey) {
    return new Response(
      JSON.stringify({ error: "LOVABLE_API_KEY non configurée — agent souverain indisponible" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    // ── Auth ──────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub;

    // ── Rate limit RÉEL via DB (stateless-safe) ───────────────
    const db = createClient(supabaseUrl, serviceKey);
    const { data: allowed, error: rlErr } = await db.rpc("check_rate_limit", {
      p_user_id: userId,
      p_function_name: "sovereign-analyze",
      p_max_per_minute: 10,
    });
    if (rlErr) {
      console.error("check_rate_limit error:", rlErr.message);
    }
    if (allowed === false) {
      return new Response(
        JSON.stringify({ error: "Limite de 10 appels/min atteinte — réessayez dans un moment" }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" } }
      );
    }

    // ── Parse body ────────────────────────────────────────────
    let body: {
      organization_id?: string;
      entity_type?: string;
      entity_id?: string;
      context?: Record<string, unknown>;
    };
    try { body = await req.json(); } catch {
      return new Response(JSON.stringify({ error: "Corps JSON invalide" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { organization_id, entity_type, entity_id } = body;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!organization_id || !uuidRegex.test(organization_id)) {
      return new Response(JSON.stringify({ error: "organization_id invalide" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Check org access ──────────────────────────────────────
    const { data: hasAccess } = await db.rpc("has_org_access", {
      _user_id: userId, _org_id: organization_id,
    });
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: "Accès refusé" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Build fact_pack from entity ───────────────────────────
    let factPack: Record<string, unknown> = {
      organization_id,
      entity_type: entity_type ?? "unknown",
      entity_id: entity_id ?? null,
      context: body.context ?? {},
      analysis_frame: "NIS2/RGPD souverain français",
    };

    if (entity_id && uuidRegex.test(entity_id)) {
      if (entity_type === "risk") {
        const { data: risk } = await db
          .from("risk_register")
          .select("*, assets(name, asset_type, identifier)")
          .eq("id", entity_id)
          .eq("organization_id", organization_id)
          .single();
        if (risk) {
          const signalIds: string[] = Array.isArray(risk.source_signal_ids)
            ? risk.source_signal_ids.slice(0, 5)
            : [];
          let signals: unknown[] = [];
          if (signalIds.length > 0) {
            const { data: sigs } = await db
              .from("signals")
              .select("title, description, severity, category, evidence")
              .in("id", signalIds);
            signals = sigs ?? [];
          }
          factPack = { ...factPack, risk, linked_signals: signals };
        }
      } else if (entity_type === "signal") {
        const { data: signal } = await db
          .from("signals")
          .select("*")
          .eq("id", entity_id)
          .eq("organization_id", organization_id)
          .single();
        if (signal) factPack = { ...factPack, signal };
      } else if (entity_type === "finding") {
        const { data: finding } = await db
          .from("findings")
          .select("*, assets(name, asset_type)")
          .eq("id", entity_id)
          .eq("organization_id", organization_id)
          .single();
        if (finding) factPack = { ...factPack, finding };
      }
    }

    // ── Call Gemini via Lovable AI Gateway ────────────────────
    console.log(`sovereign-analyze: org=${organization_id} type=${entity_type}`);

    const userPrompt = `Analyse le fact_pack suivant en tant que CISO français souverain. 
Appelle l'outil submit_sovereign_analysis avec ton analyse structurée NIS2/RGPD.

FACT_PACK:
${JSON.stringify(factPack, null, 2)}

RAPPEL : Analyse uniquement défensive, en français, sous prisme NIS2/RGPD. 
Génère un script bash/PowerShell de remédiation automatique si la vulnérabilité s'y prête.`;

    const aiResponse = await fetch(LOVABLE_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SOVEREIGN_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        tools: [ANALYSIS_TOOL],
        tool_choice: { type: "function", function: { name: "submit_sovereign_analysis" } },
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de taux IA atteinte — réessayez dans quelques minutes" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits IA épuisés" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      throw new Error(`AI gateway error ${aiResponse.status}: ${errText}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("Agent IA n'a retourné aucune analyse structurée");
    }

    const analysis = JSON.parse(toolCall.function.arguments);

    // ── Persist to ai_analyses ────────────────────────────────
    const { data: savedAnalysis } = await db
      .from("ai_analyses")
      .insert({
        organization_id,
        entity_type: entity_type ?? "unknown",
        entity_id: entity_id ?? organization_id,
        model_name: MODEL,
        analysis_type: "sovereign_nis2_rgpd",
        prompt_version: "2.0-sovereign",
        input_fact_pack: factPack,
        output_json: analysis,
      })
      .select("id")
      .single();

    // ── Auto-save healing script if generated ─────────────────
    let scriptId: string | null = null;
    if (
      analysis.script_healing?.type !== "none" &&
      analysis.script_healing?.script &&
      entity_type === "risk" &&
      entity_id
    ) {
      const { data: remActions } = await db
        .from("remediation_actions")
        .select("id")
        .eq("organization_id", organization_id)
        .eq("risk_id", entity_id)
        .limit(1);

      if (remActions && remActions.length > 0) {
        const encoder = new TextEncoder();
        const data = encoder.encode(analysis.script_healing.script);
        const hashBuffer = await crypto.subtle.digest("SHA-256", data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const proofHash = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

        const { data: savedScript } = await db
          .from("healing_scripts")
          .insert({
            organization_id,
            remediation_action_id: remActions[0].id,
            script_type: analysis.script_healing.type,
            script_content: analysis.script_healing.script,
            proof_hash: proofHash,
            execution_status: "pending",
          })
          .select("id")
          .single();

        scriptId = savedScript?.id ?? null;
      }
    }

    console.log(`sovereign-analyze: analysis=${savedAnalysis?.id} script=${scriptId}`);

    return new Response(
      JSON.stringify({
        success: true,
        analysis_id: savedAnalysis?.id ?? null,
        script_id: scriptId,
        analysis,
        sovereign_badge: "🇫🇷 Analyse souveraine — Agent CISO IA — NIS2/RGPD",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    console.error("sovereign-analyze fatal:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { buildCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
