/**
 * CYBER SERENITY — Shared Gemini/AI Utility (Server-side only)
 *
 * Uses LOVABLE_API_KEY (pre-configured) routing to google/gemini-2.5-flash
 * via the Lovable AI Gateway. Falls back to GEMINI_API_KEY if configured.
 *
 * RULES:
 * - Never called from frontend
 * - Never invents facts — facts come from input_fact_pack
 * - Strict JSON output via tool_calling
 * - Defensive / legal / non-offensive posture
 */

const LOVABLE_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const DEFAULT_MODEL = "google/gemini-2.5-flash";

const SYSTEM_PROMPT_BASE = `You are a defensive cybersecurity analysis assistant for Cyber Serenity.

STRICT RULES:
- You NEVER invent facts. All your analysis is based ONLY on the provided fact_pack.
- You NEVER suggest offensive, intrusive, or unauthorized actions.
- You NEVER provide exploitation techniques or attack instructions.
- You ALWAYS recommend legal, authorized, defensive remediations.
- You respond ONLY in the JSON format requested via tool_calling.
- If the fact_pack is insufficient, you say so explicitly in your response fields.
- Your tone is professional, precise, and actionable.
- Remediation steps must be concrete, realistic, and prioritized.`;

export type AnalysisType = "technical_analysis" | "remediation_plan";

export interface TechnicalAnalysisOutput {
  explanation: string;
  confidence_assessment: string;
  probable_impact: string;
  recommended_actions: string[];
  limitations: string;
}

export interface RemediationPlanOutput {
  summary: string;
  actions: Array<{
    title: string;
    action_type: string; // 'patch' | 'config' | 'process' | 'monitoring' | 'accept'
    priority: string;    // 'critical' | 'high' | 'medium' | 'low'
    expected_gain: string;
    implementation_notes: string;
    estimated_effort: string;
  }>;
  business_rationale: string;
  limitations: string;
}

function getApiKey(): string {
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  if (lovableKey) return lovableKey;
  const geminiKey = Deno.env.get("GEMINI_API_KEY");
  if (geminiKey) return geminiKey;
  throw new Error("No AI API key configured (LOVABLE_API_KEY or GEMINI_API_KEY required)");
}

function isConfigured(): boolean {
  return !!(Deno.env.get("LOVABLE_API_KEY") || Deno.env.get("GEMINI_API_KEY"));
}

const TECHNICAL_ANALYSIS_TOOL = {
  type: "function",
  function: {
    name: "submit_technical_analysis",
    description: "Submit the structured technical security analysis",
    parameters: {
      type: "object",
      properties: {
        explanation: {
          type: "string",
          description: "Clear technical explanation of the signal/finding based strictly on the fact_pack"
        },
        confidence_assessment: {
          type: "string",
          description: "Assessment of confidence level and what additional evidence would increase certainty"
        },
        probable_impact: {
          type: "string",
          description: "Probable technical and business impact if this signal represents a real issue"
        },
        recommended_actions: {
          type: "array",
          items: { type: "string" },
          description: "Ordered list of concrete defensive remediation actions"
        },
        limitations: {
          type: "string",
          description: "What is unknown or uncertain based on the available facts"
        }
      },
      required: ["explanation", "confidence_assessment", "probable_impact", "recommended_actions", "limitations"],
      additionalProperties: false
    }
  }
};

const REMEDIATION_PLAN_TOOL = {
  type: "function",
  function: {
    name: "submit_remediation_plan",
    description: "Submit the structured remediation plan for a risk",
    parameters: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "Executive summary of the remediation approach"
        },
        actions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title:                { type: "string" },
              action_type:          { type: "string", enum: ["patch", "config", "process", "monitoring", "accept"] },
              priority:             { type: "string", enum: ["critical", "high", "medium", "low"] },
              expected_gain:        { type: "string" },
              implementation_notes: { type: "string" },
              estimated_effort:     { type: "string" }
            },
            required: ["title", "action_type", "priority", "expected_gain", "implementation_notes", "estimated_effort"],
            additionalProperties: false
          },
          description: "List of concrete remediation actions, ordered by priority"
        },
        business_rationale: {
          type: "string",
          description: "Non-technical explanation of why this remediation matters for the business"
        },
        limitations: {
          type: "string",
          description: "What additional context would improve this plan"
        }
      },
      required: ["summary", "actions", "business_rationale", "limitations"],
      additionalProperties: false
    }
  }
};

export async function callGemini(
  analysisType: AnalysisType,
  factPack: Record<string, unknown>
): Promise<TechnicalAnalysisOutput | RemediationPlanOutput> {
  const apiKey = getApiKey();

  const tool = analysisType === "technical_analysis"
    ? TECHNICAL_ANALYSIS_TOOL
    : REMEDIATION_PLAN_TOOL;

  const toolName = analysisType === "technical_analysis"
    ? "submit_technical_analysis"
    : "submit_remediation_plan";

  const userPrompt = `Analyze the following fact_pack and call the tool ${toolName} with your structured analysis.

FACT_PACK:
${JSON.stringify(factPack, null, 2)}

Remember: base your analysis ONLY on the facts provided above. Do not invent data.`;

  const response = await fetch(LOVABLE_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT_BASE },
        { role: "user", content: userPrompt },
      ],
      tools: [tool],
      tool_choice: { type: "function", function: { name: toolName } },
      temperature: 0.1, // Low temperature for consistent, factual output
    }),
  });

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("AI rate limit exceeded — please retry later");
    }
    if (response.status === 402) {
      throw new Error("AI credits exhausted — please add funds to your workspace");
    }
    const errText = await response.text();
    throw new Error(`AI gateway error ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall?.function?.arguments) {
    throw new Error("AI returned no structured output");
  }

  return JSON.parse(toolCall.function.arguments);
}

export { isConfigured };
