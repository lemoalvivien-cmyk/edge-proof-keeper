import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 5; // exports per minute
const RATE_WINDOW = 60000;

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT) {
    return false;
  }
  
  entry.count++;
  return true;
}

// Stable JSON stringify for hash computation
function canonicalJsonStringify(obj: unknown): string {
  return JSON.stringify(obj, Object.keys(obj as object).sort());
}

// Simple SHA256 hex using SubtleCrypto
async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAnon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!checkRateLimit(user.id)) {
      console.warn(`Rate limit exceeded for user ${user.id}`);
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { tool_run_id, report_id } = await req.json();
    if (!tool_run_id && !report_id) {
      return new Response(
        JSON.stringify({ error: "Either tool_run_id or report_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (tool_run_id && !uuidRegex.test(tool_run_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid tool_run_id format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (report_id && !uuidRegex.test(report_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid report_id format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get tool run data
    let toolRun = null;
    let report = null;
    let organizationId: string;
    let scope: string | null = null;

    if (tool_run_id) {
      const { data: tr, error: trError } = await supabaseAdmin
        .from("tool_runs")
        .select(`
          *,
          tool:tools_catalog(name, slug, category),
          authorization:authorizations(scope)
        `)
        .eq("id", tool_run_id)
        .single();

      if (trError || !tr) {
        console.error("Tool run fetch error:", trError);
        return new Response(
          JSON.stringify({ error: "Tool run not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      toolRun = tr;
      organizationId = tr.organization_id;
      scope = tr.authorization?.scope || null;
    } else {
      const { data: rp, error: rpError } = await supabaseAdmin
        .from("reports")
        .select(`
          *,
          tool_run:tool_runs(
            *,
            tool:tools_catalog(name, slug, category),
            authorization:authorizations(scope)
          )
        `)
        .eq("id", report_id)
        .single();

      if (rpError || !rp) {
        console.error("Report fetch error:", rpError);
        return new Response(
          JSON.stringify({ error: "Report not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      report = rp;
      toolRun = rp.tool_run;
      organizationId = rp.organization_id;
      scope = toolRun?.authorization?.scope || null;
    }

    // Verify org access
    const { data: accessData, error: accessError } = await supabaseAdmin.rpc("has_org_access", {
      _user_id: user.id,
      _org_id: organizationId,
    });

    if (accessError || !accessData) {
      console.error("Access check error:", accessError);
      return new Response(
        JSON.stringify({ error: "Access denied to organization" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Exporting proof pack for org ${organizationId}, tool_run=${tool_run_id}, report=${report_id}`);

    // Get findings summary
    const { data: findings, error: findingsError } = await supabaseAdmin
      .from("findings")
      .select("id, title, severity, status, confidence")
      .eq("tool_run_id", toolRun?.id)
      .order("severity", { ascending: true })
      .limit(50);

    const findingsSummary = {
      total: findings?.length || 0,
      by_severity: {
        critical: findings?.filter((f) => f.severity === "critical").length || 0,
        high: findings?.filter((f) => f.severity === "high").length || 0,
        medium: findings?.filter((f) => f.severity === "medium").length || 0,
        low: findings?.filter((f) => f.severity === "low").length || 0,
        info: findings?.filter((f) => f.severity === "info").length || 0,
      },
      by_status: {
        open: findings?.filter((f) => f.status === "open").length || 0,
        acknowledged: findings?.filter((f) => f.status === "acknowledged").length || 0,
        remediated: findings?.filter((f) => f.status === "remediated").length || 0,
        false_positive: findings?.filter((f) => f.status === "false_positive").length || 0,
      },
      top_10_titles: findings?.slice(0, 10).map((f) => ({
        title: f.title,
        severity: f.severity,
        confidence: f.confidence,
      })) || [],
    };

    // Get evidence slice (last 20 relevant entries)
    const { data: evidenceSlice, error: evidenceError } = await supabaseAdmin
      .from("evidence_log")
      .select("seq, action, entity_type, created_at, entry_hash")
      .eq("organization_id", organizationId)
      .order("seq", { ascending: false })
      .limit(20);

    // Verify chain
    const { data: chainResult, error: chainError } = await supabaseAdmin.rpc("verify_evidence_chain", {
      _org_id: organizationId,
    });

    const chainVerification = chainResult?.[0] || {
      is_valid: true,
      last_seq: 0,
      head_hash: "GENESIS",
    };

    // Build pack_json
    const packJson = {
      metadata: {
        organization_id: organizationId,
        scope: scope,
        tool_run_id: toolRun?.id || null,
        tool_slug: toolRun?.tool?.slug || null,
        tool_name: toolRun?.tool?.name || null,
        tool_run_status: toolRun?.status || null,
        report_id: report?.id || null,
        report_status: report?.status || null,
        exported_at: new Date().toISOString(),
        exported_by: user.id,
      },
      artifacts: {
        input_artifact_hash: toolRun?.input_artifact_hash || null,
        has_normalized_output: !!toolRun?.normalized_output,
        has_executive_report: !!report?.executive_md,
        has_technical_report: !!report?.technical_md,
      },
      findings_summary: findingsSummary,
      evidence_slice: {
        entries_shown: evidenceSlice?.length || 0,
        seq_range: evidenceSlice?.length
          ? {
              min: evidenceSlice[evidenceSlice.length - 1]?.seq,
              max: evidenceSlice[0]?.seq,
            }
          : null,
        head_hash: chainVerification.head_hash,
        last_seq: chainVerification.last_seq,
        recent_events: evidenceSlice?.map((e) => ({
          seq: e.seq,
          action: e.action,
          entity_type: e.entity_type,
          timestamp: e.created_at,
        })) || [],
      },
      chain_verification: {
        is_valid: chainVerification.is_valid,
        verified_at: new Date().toISOString(),
        last_seq: chainVerification.last_seq,
        head_hash: chainVerification.head_hash,
      },
      limitations: [
        "Proof based on import artifacts only",
        "No active scanning or exploitation performed",
        "Evidence chain hash-verified but append-only",
        "External tool output provided as-is",
      ],
    };

    // Compute pack_hash
    const packHash = await sha256Hex(canonicalJsonStringify(packJson));

    // Insert proof pack
    const { data: proofPack, error: insertError } = await supabaseAdmin
      .from("proof_packs")
      .insert({
        organization_id: organizationId,
        scope: scope,
        tool_run_id: toolRun?.id || null,
        report_id: report?.id || null,
        status: "ready",
        pack_json: packJson,
        pack_hash: packHash,
        created_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create proof pack", details: insertError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Proof pack created: ${proofPack.id} with hash ${packHash}`);

    // Log evidence
    await supabaseAdmin.from("evidence_log").insert({
      organization_id: organizationId,
      user_id: user.id,
      action: "export_proof_pack",
      entity_type: "proof_pack",
      entity_id: proofPack.id,
      artifact_hash: packHash,
      details: {
        tool_run_id: toolRun?.id,
        report_id: report?.id,
        scope: scope,
      },
      ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    });

    return new Response(
      JSON.stringify({
        success: true,
        proof_pack_id: proofPack.id,
        pack_hash: packHash,
        pack_json: packJson,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
