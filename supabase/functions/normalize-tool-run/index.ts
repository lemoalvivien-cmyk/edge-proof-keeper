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

// Finding type detection based on tool slug and content
function detectFindingType(slug: string, finding: Record<string, unknown>): string {
  const typeMap: Record<string, string[]> = {
    subdomain: ["subfinder", "amass", "assetfinder"],
    open_port: ["nmap", "masscan", "rustscan"],
    tls_issue: ["testssl", "sslyze", "tlsx"],
    secret_leak: ["gitleaks", "trufflehog", "secretfinder"],
    vuln_template: ["nuclei"],
    dependency: ["trivy", "snyk", "npm-audit", "grype"],
    iac_misconfig: ["checkov", "tfsec", "terrascan"],
  };

  for (const [type, slugs] of Object.entries(typeMap)) {
    if (slugs.some(s => slug.toLowerCase().includes(s))) {
      return type;
    }
  }

  // Try to infer from finding content
  const title = String(finding.title || finding.name || "").toLowerCase();
  if (title.includes("subdomain") || title.includes("host")) return "subdomain";
  if (title.includes("port") || title.includes("service")) return "open_port";
  if (title.includes("ssl") || title.includes("tls") || title.includes("certificate")) return "tls_issue";
  if (title.includes("secret") || title.includes("key") || title.includes("password") || title.includes("token")) return "secret_leak";
  if (title.includes("cve") || title.includes("vuln")) return "vuln_template";
  if (title.includes("dependency") || title.includes("package")) return "dependency";

  return "unknown";
}

// Map severity strings to risk_level enum
function mapSeverity(sev: unknown): string {
  const s = String(sev || "").toLowerCase();
  if (s === "critical" || s === "crit") return "critical";
  if (s === "high") return "high";
  if (s === "medium" || s === "med" || s === "moderate") return "medium";
  if (s === "low") return "low";
  return "info";
}

// Determine confidence based on data quality
function determineConfidence(finding: Record<string, unknown>): string {
  const hasEvidence = finding.evidence || finding.matched || finding.output;
  const hasReference = finding.reference || finding.references || finding.cve || finding.cwe;
  
  if (hasEvidence && hasReference) return "high";
  if (hasEvidence || hasReference) return "medium";
  return "low";
}

// Extract references from finding
function extractReferences(finding: Record<string, unknown>): string[] {
  const refs: string[] = [];
  
  if (finding.reference) refs.push(String(finding.reference));
  if (Array.isArray(finding.references)) {
    refs.push(...finding.references.map(String));
  }
  if (finding.cve) refs.push(`CVE: ${finding.cve}`);
  if (finding.cwe) refs.push(`CWE: ${finding.cwe}`);
  if (finding.url) refs.push(String(finding.url));
  
  return [...new Set(refs)]; // dedupe
}

// GDPR/NIS2 control mapping rules (high-level, non-inventive)
const CONTROL_MAPPING_RULES: Array<{
  findingTypes: string[];
  framework: "gdpr" | "nis2";
  controlIdPattern: string;
  reason: string;
}> = [
  {
    findingTypes: ["secret_leak"],
    framework: "gdpr",
    controlIdPattern: "GDPR-32",
    reason: "Les fuites de secrets peuvent compromettre les données personnelles (Art. 32 - Sécurité du traitement)",
  },
  {
    findingTypes: ["secret_leak", "tls_issue"],
    framework: "gdpr",
    controlIdPattern: "GDPR-5",
    reason: "Défaut de protection des données en transit ou au repos (Art. 5 - Intégrité et confidentialité)",
  },
  {
    findingTypes: ["vuln_template", "dependency"],
    framework: "nis2",
    controlIdPattern: "NIS2-21",
    reason: "Vulnérabilités non corrigées affectant la gestion des risques (Art. 21 - Mesures de gestion des risques)",
  },
  {
    findingTypes: ["iac_misconfig"],
    framework: "nis2",
    controlIdPattern: "NIS2-21",
    reason: "Mauvaise configuration d'infrastructure (Art. 21 - Sécurité des systèmes)",
  },
  {
    findingTypes: ["open_port"],
    framework: "nis2",
    controlIdPattern: "NIS2-21",
    reason: "Surface d'attaque exposée (Art. 21 - Gestion des accès)",
  },
];

Deno.serve(async (req) => {
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
    const internalEdgeToken = Deno.env.get("INTERNAL_EDGE_TOKEN")!;

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

    const toolSlug = toolRun.tools_catalog?.slug || "unknown";
    const normalizedOutput = toolRun.normalized_output || {};
    const rawFindings = normalizedOutput.findings || [];
    const mode = toolRun.mode || "unknown";
    
    const limitations: string[] = [];
    let overallConfidence = "high";

    // Determine if this is a structured import or unstructured
    const isStructuredImport = mode.includes("json") || rawFindings.length > 0;
    const isPdfImport = mode.includes("pdf");
    const isCsvImport = mode.includes("csv");

    if (!isStructuredImport) {
      overallConfidence = "low";
      if (isPdfImport) {
        limitations.push("Import PDF - extraction non structurée");
      } else if (isCsvImport) {
        limitations.push("Import CSV - mapping approximatif");
      } else {
        limitations.push("Format d'import non reconnu");
      }
    }

    // Normalize findings
    const canonicalFindings: Array<{
      organization_id: string;
      tool_run_id: string;
      asset_id: string | null;
      title: string;
      finding_type: string;
      severity: string;
      confidence: string;
      evidence: Record<string, unknown>;
      references: string[];
      status: string;
    }> = [];

    if (rawFindings.length === 0 && !isStructuredImport) {
      // Create a placeholder finding for unstructured imports
      canonicalFindings.push({
        organization_id: toolRun.organization_id,
        tool_run_id: tool_run_id,
        asset_id: toolRun.asset_id || null,
        title: isPdfImport 
          ? "Rapport PDF importé - analyse manuelle requise"
          : isCsvImport
            ? "Données CSV importées - vérification requise"
            : "Import non structuré - données à valider",
        finding_type: "unknown",
        severity: "info",
        confidence: "low",
        evidence: {
          source: mode,
          import_timestamp: new Date().toISOString(),
          note: "Aucun finding structuré extrait - analyse complémentaire recommandée",
        },
        references: [],
        status: "open",
      });
      limitations.push("Aucun finding structuré extrait de l'import");
    } else {
      for (const raw of rawFindings) {
        const finding = typeof raw === "object" && raw !== null ? raw as Record<string, unknown> : { title: String(raw) };
        
        const info = finding.info as Record<string, unknown> | undefined;
        const title = String(finding.title || finding.name || info?.name || "Finding sans titre");
        const findingType = detectFindingType(toolSlug, finding);
        const severity = mapSeverity(finding.severity || info?.severity);
        const confidence = determineConfidence(finding);
        
        // Build minimal evidence (no sensitive exploitation details)
        const evidence: Record<string, unknown> = {};
        if (finding.host) evidence.host = finding.host;
        if (finding.ip) evidence.ip = finding.ip;
        if (finding.port) evidence.port = finding.port;
        if (finding.protocol) evidence.protocol = finding.protocol;
        if (finding.matched) evidence.matched = String(finding.matched).substring(0, 500); // truncate
        if (finding.template) evidence.template = finding.template;
        if (finding.path) evidence.path = finding.path;
        
        canonicalFindings.push({
          organization_id: toolRun.organization_id,
          tool_run_id: tool_run_id,
          asset_id: toolRun.asset_id || null,
          title,
          finding_type: findingType,
          severity,
          confidence,
          evidence,
          references: extractReferences(finding),
          status: "open",
        });

        if (confidence === "low") {
          overallConfidence = overallConfidence === "high" ? "medium" : overallConfidence;
        }
      }
    }

    // Delete existing findings for this tool_run (upsert behavior)
    await supabase
      .from("findings")
      .delete()
      .eq("tool_run_id", tool_run_id);

    // Insert new findings
    const { data: insertedFindings, error: insertError } = await supabase
      .from("findings")
      .insert(canonicalFindings)
      .select();

    if (insertError) {
      console.error("Findings insert error:", insertError);
      return new Response(JSON.stringify({ error: "Failed to insert findings" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate counts
    const counts = {
      critical: canonicalFindings.filter(f => f.severity === "critical").length,
      high: canonicalFindings.filter(f => f.severity === "high").length,
      medium: canonicalFindings.filter(f => f.severity === "medium").length,
      low: canonicalFindings.filter(f => f.severity === "low").length,
      info: canonicalFindings.filter(f => f.severity === "info").length,
      total: canonicalFindings.length,
    };

    // Update tool_run summary
    const summary = {
      counts,
      confidence: overallConfidence,
      limitations,
      normalized_at: new Date().toISOString(),
    };

    await supabase
      .from("tool_runs")
      .update({ summary })
      .eq("id", tool_run_id);

    // Create control links for GDPR/NIS2 mapping
    if (insertedFindings && insertedFindings.length > 0) {
      // Fetch available controls
      const { data: controls } = await supabase
        .from("compliance_controls")
        .select("id, control_id, framework");

      if (controls && controls.length > 0) {
        const controlLinks: Array<{
          finding_id: string;
          framework: string;
          control_id: string;
          reason: string;
        }> = [];

        for (const finding of insertedFindings) {
          for (const rule of CONTROL_MAPPING_RULES) {
            if (rule.findingTypes.includes(finding.finding_type)) {
              // Find matching control
              const matchingControl = controls.find(
                c => c.framework === rule.framework && 
                     c.control_id.includes(rule.controlIdPattern.split("-")[1] || "")
              );
              
              if (matchingControl) {
                controlLinks.push({
                  finding_id: finding.id,
                  framework: rule.framework,
                  control_id: matchingControl.id,
                  reason: rule.reason,
                });
              }
            }
          }
        }

        if (controlLinks.length > 0) {
          await supabase
            .from("finding_control_links")
            .insert(controlLinks);
        }
      }
    }

    // Log to evidence_log via internal endpoint
    const normalizedPayload = {
      tool_run_id,
      tool_slug: toolSlug,
      findings_count: canonicalFindings.length,
      counts,
      confidence: overallConfidence,
      limitations,
    };
    const payloadHash = await sha256(JSON.stringify(normalizedPayload));

    await logEvidenceInternal(supabaseUrl, authHeader, internalEdgeToken, {
      organization_id: toolRun.organization_id,
      action: "normalized",
      entity_type: "tool_run",
      entity_id: tool_run_id,
      artifact_hash: payloadHash,
      details: normalizedPayload,
    });

    console.log(`Normalized tool_run ${tool_run_id}: ${canonicalFindings.length} findings`);

    return new Response(
      JSON.stringify({
        success: true,
        findings_count: canonicalFindings.length,
        counts,
        confidence: overallConfidence,
        limitations,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Normalize tool run error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
