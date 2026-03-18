/**
 * check-entitlement
 * Server-side paywall check: verifies Stripe subscription status for the
 * authenticated user and returns { entitled, plan, trial_active, trial_end }.
 * verify_jwt = false — JWT validated in code via getClaims().
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { buildCorsHeaders, handleCors } from "../_shared/cors.ts";

const PRODUCT_TO_PLAN: Record<string, string> = {
  "prod_U9gs4vKy7x89uV": "starter",
  "prod_U9gsge4Z6Q7ztW": "pro",
};

const log = (step: string, details?: unknown) =>
  console.log(`[CHECK-ENTITLEMENT] ${step}${details ? ` — ${JSON.stringify(details)}` : ""}`);

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  const corsHeaders = buildCorsHeaders(req);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = userData.user;
    log("Checking entitlement for", { email: user.email });

    // ── Stripe check ─────────────────────────────────────────────────────────
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });

    if (customers.data.length === 0) {
      log("No Stripe customer found — not entitled");

      // Ensure profile subscription_status is 'none'
      await supabase.from("profiles").update({ subscription_status: "none" }).eq("id", user.id);

      return new Response(
        JSON.stringify({ entitled: false, plan: null, trial_active: false, trial_end: null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const customerId = customers.data[0].id;

    const [activeSubs, trialingSubs] = await Promise.all([
      stripe.subscriptions.list({ customer: customerId, status: "active", limit: 1 }),
      stripe.subscriptions.list({ customer: customerId, status: "trialing", limit: 1 }),
    ]);

    const sub = activeSubs.data[0] ?? trialingSubs.data[0];

    if (!sub) {
      log("No active/trialing subscription — not entitled");
      await supabase.from("profiles")
        .update({ subscription_status: "expired", stripe_customer_id: customerId })
        .eq("id", user.id);

      return new Response(
        JSON.stringify({ entitled: false, plan: null, trial_active: false, trial_end: null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const productId = sub.items.data[0]?.price?.product as string;
    const plan = PRODUCT_TO_PLAN[productId] ?? "starter";
    const isTrialing = sub.status === "trialing";
    const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null;
    const subscriptionEnd = new Date(sub.current_period_end * 1000).toISOString();

    // Sync subscription status back to profile
    await supabase.from("profiles").update({
      subscription_status: isTrialing ? "trialing" : "active",
      subscription_plan: plan,
      subscription_end: subscriptionEnd,
      stripe_customer_id: customerId,
    }).eq("id", user.id);

    log("Entitled", { plan, isTrialing, trialEnd });

    return new Response(
      JSON.stringify({
        entitled: true,
        plan,
        trial_active: isTrialing,
        trial_end: trialEnd,
        subscription_end: subscriptionEnd,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    log("ERROR", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message, entitled: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
