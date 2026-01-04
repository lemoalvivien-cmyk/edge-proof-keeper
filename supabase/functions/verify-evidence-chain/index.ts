import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory rate limiting (resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // requests per minute
const RATE_WINDOW = 60000; // 1 minute in ms

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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Get auth token from request
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify auth
    const supabaseAnon = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Rate limit check
    if (!checkRateLimit(user.id)) {
      console.warn(`Rate limit exceeded for user ${user.id}`);
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { organization_id } = await req.json();
    if (!organization_id) {
      return new Response(
        JSON.stringify({ error: "organization_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(organization_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid organization_id format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role client for operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Check org access
    const { data: accessData, error: accessError } = await supabaseAdmin.rpc("has_org_access", {
      _user_id: user.id,
      _org_id: organization_id,
    });

    if (accessError || !accessData) {
      console.error("Access check error:", accessError);
      return new Response(
        JSON.stringify({ error: "Access denied to organization" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Verifying evidence chain for org ${organization_id} by user ${user.id}`);

    // Call verify_evidence_chain function
    const { data: verifyResult, error: verifyError } = await supabaseAdmin.rpc("verify_evidence_chain", {
      _org_id: organization_id,
    });

    if (verifyError) {
      console.error("Verification error:", verifyError);
      return new Response(
        JSON.stringify({ error: "Chain verification failed", details: verifyError.message }),
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

    console.log(`Chain verification result: is_valid=${result.is_valid}, last_seq=${result.last_seq}, legacy_rows=${result.legacy_rows_count}`);

    // Log this verification to evidence
    const logPayload = {
      organization_id,
      user_id: user.id,
      action: "verify_chain",
      entity_type: "evidence",
      entity_id: null,
      details: {
        is_valid: result.is_valid,
        last_seq: result.last_seq,
        head_hash: result.head_hash,
        first_bad_seq: result.first_bad_seq,
      },
      ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
    };

    // Insert evidence log entry
    const { error: logError } = await supabaseAdmin.from("evidence_log").insert(logPayload);
    if (logError) {
      console.warn("Failed to log verification event:", logError);
      // Don't fail the request, just log warning
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
          // Don't expose hash details for security
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
