/**
 * check-entitlement
 * Server-side paywall check: verifies access rights for the authenticated user.
 *
 * Decision order (CRITICAL — do not change):
 * 1. Load the user's profile
 * 2. If subscription_status = 'granted' AND subscription_end > now() → entitled immediately
 *    (promo code access — must NOT be overwritten by Stripe checks)
 * 3. If access has expired (granted but past subscription_end) → mark expired
 * 4. Otherwise execute Stripe subscription check
 * 5. If no Stripe customer/subscription → not entitled
 *
 * verify_jwt = false — JWT validated in code via supabase.auth.getUser().
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
  console.log(
    `[CHECK-ENTITLEMENT] ${step}${details ? ` — ${JSON.stringify(details)}` : ""}`
  );

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
    // ── Auth ────────────────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } =
      await supabase.auth.getUser(token);
    if (userError || !userData.user?.email) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = userData.user;
    log("Checking entitlement for", { email: user.email });

    // ── Step 1: Load profile ─────────────────────────────────────────────────
    const { data: profile } = await supabase
      .from("profiles")
      .select(
        "id, subscription_status, subscription_plan, subscription_end, stripe_customer_id, access_grant_source, access_grant_end"
      )
      .eq("id", user.id)
      .maybeSingle();

    const now = new Date();

    // ── Step 2: Honour promo code access ('granted') ─────────────────────────
    // CRITICAL: never overwrite a valid granted access with Stripe logic.
    if (profile?.subscription_status === "granted") {
      const grantEnd = profile.subscription_end
        ? new Date(profile.subscription_end)
        : null;

      if (grantEnd && grantEnd > now) {
        // Access is active — return immediately, skip Stripe entirely
        log("Promo access active", {
          userId: user.id,
          plan: profile.subscription_plan,
          accessUntil: profile.subscription_end,
        });
        return new Response(
          JSON.stringify({
            entitled: true,
            plan: profile.subscription_plan ?? "pro",
            trial_active: false,
            trial_end: null,
            subscription_end: profile.subscription_end,
            access_source: "promo_code",
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Promo access has expired — update profile to 'expired'
      log("Promo access expired", { userId: user.id });
      await supabase
        .from("profiles")
        .update({
          subscription_status: "expired",
          subscription_plan: null,
          subscription_end: null,
        })
        .eq("id", user.id);

      return new Response(
        JSON.stringify({
          entitled: false,
          plan: null,
          trial_active: false,
          trial_end: null,
          subscription_end: null,
          access_source: "promo_code_expired",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Step 3: Stripe check ─────────────────────────────────────────────────
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const customers = await stripe.customers.list({
      email: user.email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      log("No Stripe customer found — not entitled");
      // Only reset if not 'granted' (already handled above)
      if (profile?.subscription_status !== "granted") {
        await supabase
          .from("profiles")
          .update({ subscription_status: "none" })
          .eq("id", user.id);
      }

      return new Response(
        JSON.stringify({
          entitled: false,
          plan: null,
          trial_active: false,
          trial_end: null,
          subscription_end: null,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const customerId = customers.data[0].id;

    const [activeSubs, trialingSubs] = await Promise.all([
      stripe.subscriptions.list({
        customer: customerId,
        status: "active",
        limit: 1,
      }),
      stripe.subscriptions.list({
        customer: customerId,
        status: "trialing",
        limit: 1,
      }),
    ]);

    const sub = activeSubs.data[0] ?? trialingSubs.data[0];

    if (!sub) {
      log("No active/trialing Stripe subscription — not entitled");
      await supabase
        .from("profiles")
        .update({
          subscription_status: "expired",
          stripe_customer_id: customerId,
        })
        .eq("id", user.id);

      return new Response(
        JSON.stringify({
          entitled: false,
          plan: null,
          trial_active: false,
          trial_end: null,
          subscription_end: null,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Active Stripe subscription ───────────────────────────────────────────
    const productId = sub.items.data[0]?.price?.product as string;
    const plan = PRODUCT_TO_PLAN[productId] ?? "starter";
    const isTrialing = sub.status === "trialing";
    const trialEnd = sub.trial_end
      ? new Date(sub.trial_end * 1000).toISOString()
      : null;
    const subscriptionEnd = new Date(
      sub.current_period_end * 1000
    ).toISOString();

    await supabase
      .from("profiles")
      .update({
        subscription_status: isTrialing ? "trialing" : "active",
        subscription_plan: plan,
        subscription_end: subscriptionEnd,
        stripe_customer_id: customerId,
      })
      .eq("id", user.id);

    log("Stripe access active", { plan, isTrialing, trialEnd });

    return new Response(
      JSON.stringify({
        entitled: true,
        plan,
        trial_active: isTrialing,
        trial_end: trialEnd,
        subscription_end: subscriptionEnd,
        access_source: "stripe",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    log("ERROR", { message: error.message });
    return new Response(
      JSON.stringify({ error: error.message, entitled: false }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
