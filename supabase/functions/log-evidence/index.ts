import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // This function is meant to be called ONLY from other edge functions (server-to-server)
    // It uses service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const {
      organization_id,
      user_id,
      action,
      entity_type,
      entity_id,
      details,
      artifact_hash,
      ip_address,
    } = body;

    if (!organization_id || !action || !entity_type) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: organization_id, action, entity_type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get IP from request if not provided
    const clientIp = ip_address || 
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      null;

    // Truncate IP for GDPR
    const truncatedIp = truncateIP(clientIp);

    // Insert into evidence_log - the trigger will compute seq, prev_hash, entry_hash
    const { data: logEntry, error: insertError } = await supabase
      .from("evidence_log")
      .insert({
        organization_id,
        user_id: user_id || null,
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
        JSON.stringify({ error: "Failed to log evidence", details: insertError.message }),
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
