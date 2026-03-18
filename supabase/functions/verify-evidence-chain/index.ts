import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { buildCorsHeaders, handleCors } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const corsPreflightResponse = handleCors(req);
  if (corsPreflightResponse) return corsPreflightResponse;
  const corsHeaders = buildCorsHeaders(req);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const internalEdgeToken = Deno.env.get("INTERNAL_EDGE_TOKEN")!;

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
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { organization_id } = await req.json();
    if (!organization_id) {
      return new Response(
        JSON.stringify({ error: "organization_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(organization_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid organization_id format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // DB-backed rate limiting (replaces in-memory)
    const rateLimitOk = await supabaseAdmin.rpc("check_rate_limit", {
      p_user_id: user.id,
      p_function_name: "verify-evidence-chain",
      p_max_per_minute: 10,
    });
    if (!rateLimitOk.data) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check org access
    const { data: accessData, error: accessError } = await supabaseAdmin.rpc("has_org_access", {
      _user_id: user.id,
      _org_id: organization_id,
    });
    if (accessError || !accessData) {
      return new Response(
        JSON.stringify({ error: "Access denied to organization" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ADMIN-ONLY
    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc("has_role", {
      _user_id: user.id,
      _org_id: organization_id,
      _role: "admin",
    });
    if (roleError || !isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required for chain verification" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Verifying evidence chain for org ${organization_id} by admin ${user.id}`);

    const { data: verifyResult, error: verifyError } = await supabaseAdmin.rpc("verify_evidence_chain", {
      _org_id: organization_id,
    });

    if (verifyError) {
      console.error("Verification error:", verifyError);
      return new Response(
        JSON.stringify({ error: "Chain verification failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = verifyResult?.[0] || {
      is_valid: true,
      last_seq: 0,
      head_hash: "GENESIS",
      first_bad_seq: null,
      expected_hash: null,
      found_hash: null,
      legacy_rows_count: 0,
    };

    // Log verification to evidence vault (internal token)
    try {
      await fetch(`${supabaseUrl}/functions/v1/log-evidence`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": authHeader,
          "x-internal-token": internalEdgeToken,
        },
        body: JSON.stringify({
          organization_id,
          action: "verify_chain",
          entity_type: "evidence",
          entity_id: null,
          details: {
            is_valid: result.is_valid,
            last_seq: result.last_seq,
            head_hash: result.head_hash,
            first_bad_seq: result.first_bad_seq,
          },
        }),
      });
    } catch (logErr) {
      console.warn("Failed to log verification to evidence:", logErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        verification: {
          is_valid: result.is_valid,
          last_seq: result.last_seq,
          head_hash: result.head_hash,
          first_bad_seq: result.first_bad_seq,
          legacy_rows_count: result.legacy_rows_count,
          has_discrepancy: result.first_bad_seq !== null,
        },
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
