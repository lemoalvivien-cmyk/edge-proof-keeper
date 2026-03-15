import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// SHA-256 hash function
async function sha256(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest("SHA-256", dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Helper to call log-evidence with internal token
async function logEvidenceInternal(
  supabaseUrl: string,
  authHeader: string,
  internalToken: string,
  payload: Record<string, unknown>
): Promise<void> {
  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/log-evidence`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
        "x-internal-token": internalToken,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const error = await response.text();
      console.warn("Failed to log evidence:", error);
    }
  } catch (error) {
    console.warn("Failed to log evidence:", error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const internalEdgeToken = Deno.env.get("INTERNAL_EDGE_TOKEN")!;

    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create user client to verify auth
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { tool_run_id } = await req.json();

    if (!tool_run_id) {
      return new Response(JSON.stringify({ error: "tool_run_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch tool_run with tool info
    const { data: toolRun, error: runError } = await supabase
      .from("tool_runs")
      .select(`
        *,
        tools_catalog (slug, name, category)
      `)
      .eq("id", tool_run_id)
      .maybeSingle();

    if (runError || !toolRun) {
      console.error("Tool run fetch error:", runError);
      return new Response(JSON.stringify({ error: "Tool run not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify org access using has_org_access RPC
    const { data: orgAccess, error: orgError } = await supabase.rpc('has_org_access', {
      _user_id: user.id,
      _org_id: toolRun.organization_id,
    });

    if (orgError || !orgAccess) {
      console.error("Organization access denied:", orgError);
      return new Response(JSON.stringify({ error: "Access denied" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if report already exists
    const { data: existingReport } = await supabase
      .from("reports")
      .select("id, status")
      .eq("tool_run_id", tool_run_id)
      .maybeSingle();

    if (existingReport) {
      return new Response(JSON.stringify({ 
        report_id: existingReport.id,
        status: existingReport.status,
        message: "Report already exists"
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create report record with 'generating' status
    const { data: newReport, error: insertError } = await supabase
      .from("reports")
      .insert({
        organization_id: toolRun.organization_id,
        tool_run_id: tool_run_id,
        status: "generating",
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Report insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to create report" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build fact_pack - ONLY source of truth
    const normalizedOutput = toolRun.normalized_output || {};
    const summary = toolRun.summary || {};
    const findings = normalizedOutput.findings || [];
    
    const factPack = {
      tool: {
        slug: toolRun.tools_catalog?.slug || "unknown",
        name: toolRun.tools_catalog?.name || "Unknown Tool",
        category: toolRun.tools_catalog?.category || "unknown",
      },
      run: {
        id: toolRun.id,
        mode: toolRun.mode,
        status: toolRun.status,
        requested_at: toolRun.requested_at,
        completed_at: toolRun.completed_at,
        input_artifact_hash: toolRun.input_artifact_hash,
      },
      target: normalizedOutput.target || {},
      findings: findings,
      counts: summary.counts || normalizedOutput.counts || {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
      },
      data_confidence: findings.length > 0 ? "High" : toolRun.input_artifact_hash ? "Medium" : "Low",
      notes: normalizedOutput.notes || "Import V1",
    };

    const factPackHash = await sha256(JSON.stringify(factPack));

    // System prompt for anti-hallucination
    const systemPrompt = `Tu es un expert en cybersécurité et conformité GDPR/NIS2.
Tu génères des rapports UNIQUEMENT basés sur le "fact_pack" fourni.

RÈGLES ABSOLUES:
1. NE JAMAIS inventer de CVE, vulnérabilités, assets, ports ou données non présentes dans fact_pack
2. Si une information est absente: écrire "Non déterminable" ou "Données absentes"
3. INTERDIT: instructions offensives, payloads, techniques d'exploitation
4. AUTORISÉ: risques business, recommandations high-level (patch, config, WAF, segmentation)
5. Utiliser le français professionnel

STRUCTURE RAPPORT DIRECTION (executive):
- Résumé (max 8 lignes)
- Top 5 risques business + "Pourquoi ça compte"
- Risques juridiques GDPR/NIS2 (si déductible, sinon "Non déterminable")
- Plan d'action 7/30/90 jours
- Indicateur confiance données: ${factPack.data_confidence}

STRUCTURE RAPPORT TECHNIQUE (technical):
- Contexte et périmètre (si absent → "Non déterminable")
- Tableau findings: title, severity, type, evidence
- Recommandations remédiation (high-level uniquement)
- Traçabilité: tool_run_id, hash, timestamp, sources

Réponds en JSON avec cette structure exacte:
{
  "executive": {
    "summary": "...",
    "top_risks": [{"risk": "...", "why_it_matters": "..."}],
    "legal_risks": "...",
    "action_plan": {"7_days": "...", "30_days": "...", "90_days": "..."},
    "confidence": "High|Medium|Low"
  },
  "technical": {
    "context": "...",
    "scope": "...",
    "findings_table": [{"title": "...", "severity": "...", "type": "...", "evidence": "..."}],
    "recommendations": ["..."],
    "traceability": {"tool_run_id": "...", "artifact_hash": "...", "timestamp": "...", "sources": []}
  }
}`;

    const userPrompt = `Génère les rapports basés sur ce fact_pack (SEULE source de vérité):

${JSON.stringify(factPack, null, 2)}

Nombre de findings: ${findings.length}
Si findings est vide ou absent, indique "Aucun finding importé - données insuffisantes pour analyse détaillée"`;

    // Call Lovable AI
    console.log("Calling Lovable AI for report generation...");
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      // Update report status to failed
      await supabase
        .from("reports")
        .update({ status: "failed" })
        .eq("id", newReport.id);

      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please retry later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";
    
    console.log("AI response received, parsing...");

    // Parse JSON from AI response
    let reportJson;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, aiContent];
      const jsonStr = jsonMatch[1] || aiContent;
      reportJson = JSON.parse(jsonStr.trim());
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.log("Raw AI content:", aiContent);
      
      // Fallback structure
      reportJson = {
        executive: {
          summary: "Erreur de génération - veuillez réessayer",
          top_risks: [],
          legal_risks: "Non déterminable",
          action_plan: { "7_days": "Non déterminable", "30_days": "Non déterminable", "90_days": "Non déterminable" },
          confidence: factPack.data_confidence,
        },
        technical: {
          context: "Non déterminable",
          scope: "Non déterminable",
          findings_table: findings.map((f: { title?: string; severity?: string; type?: string; evidence?: string }) => ({
            title: f.title || "Non déterminable",
            severity: f.severity || "unknown",
            type: f.type || "unknown",
            evidence: f.evidence || "Non déterminable",
          })),
          recommendations: ["Réessayer la génération du rapport"],
          traceability: {
            tool_run_id: toolRun.id,
            artifact_hash: toolRun.input_artifact_hash || "N/A",
            timestamp: new Date().toISOString(),
            sources: [],
          },
        },
      };
    }

    // Generate Markdown from JSON
    const executiveMd = generateExecutiveMarkdown(reportJson.executive, factPack);
    const technicalMd = generateTechnicalMarkdown(reportJson.technical, factPack);

    // Determine fact_pack limitations
    const limitations: string[] = [];
    if (findings.length === 0) limitations.push("Aucun finding dans les données importées");
    if (!toolRun.input_artifact_hash) limitations.push("Pas de hash d'artefact d'entrée");
    if (!normalizedOutput.target) limitations.push("Cible non spécifiée");
    if (factPack.data_confidence === "Low") limitations.push("Confiance données faible - import non structuré");

    // Build evidence_refs for anti-hallucination traceability
    const evidenceRefs = {
      tool_run_id: toolRun.id,
      artifact_hash: toolRun.input_artifact_hash,
      finding_ids: findings.map((f: { id?: string }) => f.id).filter(Boolean),
      sources: [toolRun.tools_catalog?.slug || 'unknown'],
    };

    // Build model_limits
    const modelLimits = {
      model: 'google/gemini-2.5-flash',
      fact_pack_only: true,
      no_invented_data: true,
      confidence: factPack.data_confidence,
      limitations: limitations,
    };

    // Update report with content
    const { error: updateError } = await supabase
      .from("reports")
      .update({
        status: "ready",
        executive_md: executiveMd,
        technical_md: technicalMd,
        executive_json: reportJson.executive,
        technical_json: reportJson.technical,
        evidence_refs: evidenceRefs,
        model_limits: modelLimits,
        fact_pack_hash: factPackHash,
      })
      .eq("id", newReport.id);

    if (updateError) {
      console.error("Report update error:", updateError);
    }

    // Log to evidence_log via internal endpoint
    await logEvidenceInternal(supabaseUrl, authHeader, internalEdgeToken, {
      organization_id: toolRun.organization_id,
      action: "report_generated",
      entity_type: "report",
      entity_id: newReport.id,
      artifact_hash: factPackHash,
      details: {
        tool_run_id: tool_run_id,
        tool_slug: factPack.tool.slug,
        fact_pack_confidence: factPack.data_confidence,
        limitations: limitations,
        findings_count: findings.length,
      },
    });

    console.log("Report generated successfully:", newReport.id);

    return new Response(
      JSON.stringify({
        report_id: newReport.id,
        status: "ready",
        fact_pack_hash: factPackHash,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Generate reports error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Helper: Generate Executive Markdown
function generateExecutiveMarkdown(exec: Record<string, unknown>, factPack: Record<string, unknown>): string {
  const e = exec || {};
  const topRisks = Array.isArray(e.top_risks) ? e.top_risks : [];
  const actionPlan = (e.action_plan as Record<string, string>) || {};
  
  return `# Rapport Direction - SECURIT-E

## Résumé Exécutif

${e.summary || "Non déterminable"}

## Top 5 Risques Business

${topRisks.length > 0 
  ? topRisks.map((r: { risk?: string; why_it_matters?: string }, i: number) => 
      `### ${i + 1}. ${r.risk || "Non déterminable"}
**Pourquoi c'est important:** ${r.why_it_matters || "Non déterminable"}`
    ).join("\n\n")
  : "Aucun risque identifié - données insuffisantes pour l'analyse."}

## Risques Juridiques & Conformité (RGPD/NIS2)

${e.legal_risks || "Non déterminable - analyse complémentaire requise."}

## Plan d'Action

| Horizon | Actions |
|---------|---------|
| 7 jours | ${actionPlan["7_days"] || "Non déterminable"} |
| 30 jours | ${actionPlan["30_days"] || "Non déterminable"} |
| 90 jours | ${actionPlan["90_days"] || "Non déterminable"} |

## Indicateur de Confiance des Données

**Niveau:** ${e.confidence || (factPack as Record<string, unknown>).data_confidence || "Non déterminable"}

---
*Rapport généré par SECURIT-E — Armure Cyber Autonome Souveraine 🇫🇷 — ${new Date().toLocaleDateString("fr-FR")}*
`;
}

// Helper: Generate Technical Markdown
function generateTechnicalMarkdown(tech: Record<string, unknown>, factPack: Record<string, unknown>): string {
  const t = tech || {};
  const findingsTable = Array.isArray(t.findings_table) ? t.findings_table : [];
  const recommendations = Array.isArray(t.recommendations) ? t.recommendations : [];
  const traceability = (t.traceability as Record<string, unknown>) || {};
  const run = (factPack.run as Record<string, unknown>) || {};
  
  return `# Rapport Technique - SECURIT-E

## Contexte

${t.context || "Non déterminable"}

## Périmètre

${t.scope || "Non déterminable"}

## Findings

${findingsTable.length > 0
  ? `| Titre | Sévérité | Type | Evidence |
|-------|----------|------|----------|
${findingsTable.map((f: { title?: string; severity?: string; type?: string; evidence?: string }) => 
    `| ${f.title || "N/A"} | ${f.severity || "N/A"} | ${f.type || "N/A"} | ${f.evidence || "N/A"} |`
  ).join("\n")}`
  : "Aucun finding importé - fichier non parsé ou vide."}

## Recommandations

${recommendations.length > 0
  ? recommendations.map((r: string, i: number) => `${i + 1}. ${r}`).join("\n")
  : "- Importer des résultats de scan pour obtenir des recommandations."}

## Traçabilité

| Élément | Valeur |
|---------|--------|
| Tool Run ID | \`${traceability.tool_run_id || run.id || "N/A"}\` |
| Hash Artefact | \`${traceability.artifact_hash || run.input_artifact_hash || "N/A"}\` |
| Timestamp | ${traceability.timestamp || new Date().toISOString()} |
| Sources | ${Array.isArray(traceability.sources) && traceability.sources.length > 0 ? traceability.sources.join(", ") : "Aucune"} |

---
*Rapport technique généré par SECURIT-E — Agent CISO IA Souverain 🇫🇷 NIS2/RGPD — ${new Date().toLocaleDateString("fr-FR")}*
`;
}
