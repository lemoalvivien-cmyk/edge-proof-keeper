import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-token",
};

// Truncate IP for GDPR compliance
function truncateIP(ip: string | null): string | null {
  if (!ip) return null;
  const parts = ip.split('.');
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.xxx.xxx`;
  }
  const ipv6Parts = ip.split(':');
  if (ipv6Parts.length > 4) {
    return `${ipv6Parts.slice(0, 4).join(':')}:xxxx:xxxx:xxxx:xxxx`;
  }
  return 'unknown';
}

// Allowed actions whitelist
const ALLOWED_ACTIONS = [
  'consent',
  'authorization_created',
  'authorization_approved',
  'tool_run_requested',
  'tool_run_imported',
  'normalized',
  'report_generated',
  'export_proof_pack',
  'verify_chain',
  'document_uploaded',
  'finding_status_changed',
  'task_created',
  'task_updated',
  'comment_added',
];

// Allowed entity types whitelist
const ALLOWED_ENTITY_TYPES = [
  'authorization',
  'tool_run',
  'finding',
  'report',
  'proof_pack',
  'document',
  'task',
  'evidence',
  'asset',
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const internalEdgeToken = Deno.env.get("INTERNAL_EDGE_TOKEN");

    // INTERNAL-ONLY: Require x-internal-token header
    const internalToken = req.headers.get("x-internal-token");
    if (!internalEdgeToken || !internalToken || internalToken !== internalEdgeToken) {
      console.warn("Internal token validation failed - access denied");
      return new Response(
        JSON.stringify({ error: "Forbidden - internal use only" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get auth token from request (still required for user context)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create user client to verify auth
    const supabaseUser = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      console.error("User authentication failed:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user for log-evidence:", user.id);

    // Use service role for insert (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const {
      organization_id,
      action,
      entity_type,
      entity_id,
      details,
      artifact_hash,
      // user_id ignored - we always use auth.uid()
      // ip_address ignored - we always use x-forwarded-for from headers
    } = body;

    // Validate required fields
    if (!organization_id || !action || !entity_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: organization_id, action, entity_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate UUID format for organization_id
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(organization_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid organization_id format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate entity_id if provided
    if (entity_id && !uuidRegex.test(entity_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid entity_id format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate action against whitelist
    if (!ALLOWED_ACTIONS.includes(action)) {
      console.warn(`Rejected unknown action: ${action}`);
      return new Response(
        JSON.stringify({ error: "Invalid action" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate entity_type against whitelist
    if (!ALLOWED_ENTITY_TYPES.includes(entity_type)) {
      console.warn(`Rejected unknown entity_type: ${entity_type}`);
      return new Response(
        JSON.stringify({ error: "Invalid entity_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify user has org access
    const { data: orgAccess, error: orgError } = await supabase.rpc('has_org_access', {
      _user_id: user.id,
      _org_id: organization_id,
    });

    if (orgError || !orgAccess) {
      console.error("Organization access denied:", orgError);
      return new Response(
        JSON.stringify({ error: "Access denied to organization" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get IP from request headers ONLY (never from payload)
    const clientIp = 
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    // Truncate IP for GDPR
    const truncatedIp = truncateIP(clientIp);

    // Validate artifact_hash format if provided (should be SHA-256 hex)
    if (artifact_hash && !/^[a-f0-9]{64}$/i.test(artifact_hash)) {
      return new Response(
        JSON.stringify({ error: "Invalid artifact_hash format (expected SHA-256 hex)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert into evidence_log - the trigger will compute seq, prev_hash, entry_hash
    // ALWAYS use authenticated user.id, ignore any user_id from payload
    const { data: logEntry, error: insertError } = await supabase
      .from("evidence_log")
      .insert({
        organization_id,
        user_id: user.id, // Always use authenticated user, not from payload
        action,
        entity_type,
        entity_id: entity_id || null,
        details: details || null,
        artifact_hash: artifact_hash || null,
        ip_address: truncatedIp,
        source: 'server',
      })
      .select("id, seq, entry_hash, created_at")
      .single();

    if (insertError) {
      console.error("Evidence log insert error:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to log evidence" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Evidence logged: ${action} on ${entity_type}/${entity_id || 'null'} - seq: ${logEntry.seq}`);

    return new Response(
      JSON.stringify({
        success: true,
        id: logEntry.id,
        seq: logEntry.seq,
        entry_hash: logEntry.entry_hash,
        created_at: logEntry.created_at,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Log evidence error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
