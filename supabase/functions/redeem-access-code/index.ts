/**
 * redeem-access-code
 * Validates a premium access code and grants 365-day access to the user.
 *
 * Security model:
 * - Requires valid JWT (authenticated user)
 * - Code is NEVER stored or logged in plaintext
 * - All DB writes use service role (bypasses RLS)
 * - Atomic: redemption count + profile update happen in sequence with checks
 * - Returns generic error messages to prevent enumeration
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { buildCorsHeaders, handleCors } from "../_shared/cors.ts";

const log = (step: string, details?: unknown) =>
  console.log(
    `[REDEEM-ACCESS-CODE] ${step}${details ? ` — ${JSON.stringify(details)}` : ""}`
  );

/** SHA-256 hash of a string, returned as lowercase hex */
async function sha256Hex(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  // Handle CORS pre-flight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = buildCorsHeaders(req);

  // Only POST
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Auth: require valid JWT ───────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");

  // Use service role for all DB operations
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // Validate the token to get the authenticated user
  const { data: userData, error: userError } =
    await supabase.auth.getUser(token);

  if (userError || !userData.user) {
    return new Response(JSON.stringify({ error: "Non autorisé" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const user = userData.user;

  // ── Rate limiting ─────────────────────────────────────────────────────────
  const { data: rateOk } = await supabase.rpc("check_rate_limit", {
    p_user_id: user.id,
    p_function_name: "redeem-access-code",
    p_max_per_minute: 5,
  });
  if (!rateOk) {
    return new Response(
      JSON.stringify({ error: "Trop de tentatives. Réessayez dans une minute." }),
      {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let rawCode: string;
  try {
    const body = await req.json();
    rawCode = body?.code;
  } catch {
    return new Response(JSON.stringify({ error: "Corps de requête invalide" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!rawCode || typeof rawCode !== "string") {
    return new Response(JSON.stringify({ error: "Code manquant" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Normalize: trim whitespace, uppercase — NEVER log the raw code
  const normalizedCode = rawCode.trim().toUpperCase();

  if (normalizedCode.length < 4 || normalizedCode.length > 128) {
    return new Response(JSON.stringify({ error: "Code invalide" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Hash the normalized code
  const codeHash = await sha256Hex(normalizedCode);
  log("Code hash computed", { userId: user.id, hashPrefix: codeHash.slice(0, 8) + "..." });

  // ── Check user's existing access ──────────────────────────────────────────
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, subscription_status, subscription_end, access_grant_source, access_code_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    log("Profile fetch error", { error: profileError.message });
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check if user already has an active granted access
  if (
    profile?.subscription_status === "granted" &&
    profile?.subscription_end &&
    new Date(profile.subscription_end) > new Date()
  ) {
    return new Response(
      JSON.stringify({
        error: "already_active",
        message: "Vous disposez déjà d'un accès premium actif.",
        access_until: profile.subscription_end,
      }),
      {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // ── Look up the code ──────────────────────────────────────────────────────
  const { data: codeRecord, error: codeError } = await supabase
    .from("access_codes")
    .select(
      "id, code_hash, code_label, grant_plan, grant_days, max_redemptions, redemptions_count, is_active, valid_from, valid_until, redeemed_by"
    )
    .eq("code_hash", codeHash)
    .maybeSingle();

  if (codeError) {
    log("Code lookup error", { error: codeError.message });
    return new Response(JSON.stringify({ error: "Erreur serveur" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Generic error for all invalid / exhausted / inactive codes
  // (prevents enumeration of valid codes)
  const GENERIC_INVALID = "Code invalide ou expiré.";

  if (!codeRecord) {
    log("Code not found", { hashPrefix: codeHash.slice(0, 8) });
    return new Response(JSON.stringify({ error: GENERIC_INVALID }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const now = new Date();

  if (!codeRecord.is_active) {
    log("Code inactive", { codeId: codeRecord.id });
    return new Response(JSON.stringify({ error: GENERIC_INVALID }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (new Date(codeRecord.valid_from) > now) {
    log("Code not yet valid", { codeId: codeRecord.id });
    return new Response(JSON.stringify({ error: GENERIC_INVALID }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (codeRecord.valid_until && new Date(codeRecord.valid_until) < now) {
    log("Code expired", { codeId: codeRecord.id });
    return new Response(JSON.stringify({ error: GENERIC_INVALID }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (codeRecord.redemptions_count >= codeRecord.max_redemptions) {
    log("Code fully redeemed", { codeId: codeRecord.id });
    return new Response(JSON.stringify({ error: GENERIC_INVALID }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // For single-use codes: check it hasn't been used by someone else
  if (codeRecord.max_redemptions === 1 && codeRecord.redeemed_by) {
    log("Single-use code already redeemed", { codeId: codeRecord.id });
    return new Response(JSON.stringify({ error: GENERIC_INVALID }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ── Compute access window ─────────────────────────────────────────────────
  const grantDays = codeRecord.grant_days ?? 365;
  const accessUntil = new Date(
    now.getTime() + grantDays * 24 * 60 * 60 * 1000
  ).toISOString();
  const grantPlan = codeRecord.grant_plan ?? "pro";

  log("Granting access", {
    userId: user.id,
    codeId: codeRecord.id,
    plan: grantPlan,
    days: grantDays,
    accessUntil,
  });

  // ── Atomic: update access_codes then profiles ─────────────────────────────
  // Step 1: Increment redemptions_count + set redeemed_by/at
  const { error: codeUpdateError } = await supabase
    .from("access_codes")
    .update({
      redemptions_count: codeRecord.redemptions_count + 1,
      redeemed_by: user.id,
      redeemed_at: now.toISOString(),
    })
    .eq("id", codeRecord.id)
    // Optimistic concurrency: only update if count hasn't changed
    .eq("redemptions_count", codeRecord.redemptions_count);

  if (codeUpdateError) {
    log("Code update failed (race condition?)", { error: codeUpdateError.message });
    return new Response(
      JSON.stringify({ error: "Erreur lors de la validation du code. Réessayez." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Step 2: Update profile with granted access
  const { error: profileUpdateError } = await supabase
    .from("profiles")
    .update({
      subscription_status: "granted",
      subscription_plan: grantPlan,
      subscription_end: accessUntil,
      access_grant_source: "promo_code",
      access_code_id: codeRecord.id,
      access_grant_end: accessUntil,
    })
    .eq("id", user.id);

  if (profileUpdateError) {
    log("Profile update failed", { error: profileUpdateError.message });
    // Rollback the code redemption count
    await supabase
      .from("access_codes")
      .update({
        redemptions_count: codeRecord.redemptions_count,
        redeemed_by: null,
        redeemed_at: null,
      })
      .eq("id", codeRecord.id);

    return new Response(
      JSON.stringify({ error: "Erreur lors de l'activation. Réessayez." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Step 3: Write audit event
  await supabase
    .from("access_code_events")
    .insert({
      user_id: user.id,
      access_code_id: codeRecord.id,
      code_label: codeRecord.code_label ?? null,
      event_type: "redeemed",
      plan_granted: grantPlan,
      access_until: accessUntil,
      ip_address: req.headers.get("x-forwarded-for") ?? null,
    });

  log("Access granted successfully", {
    userId: user.id,
    plan: grantPlan,
    accessUntil,
  });

  return new Response(
    JSON.stringify({
      success: true,
      plan: grantPlan,
      access_until: accessUntil,
      grant_days: grantDays,
      message: `Accès ${grantPlan.toUpperCase()} activé jusqu'au ${new Date(accessUntil).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}.`,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
