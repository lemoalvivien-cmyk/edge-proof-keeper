/**
 * stripe-webhook
 * Handles Stripe events: checkout.session.completed,
 * customer.subscription.updated, customer.subscription.deleted,
 * invoice.payment_failed.
 *
 * IMPORTANT: When updating subscription fields, we must NOT overwrite
 * an active promo code grant ('granted' status) with 'expired' unless
 * the Stripe subscription is actually replacing it (active/trialing wins).
 * If a Stripe subscription becomes 'deleted', we only set 'expired' if
 * the profile doesn't have an active promo grant.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const JSON_HEADERS = { "Content-Type": "application/json" };

const PRODUCT_TO_PLAN: Record<string, string> = {
  "prod_U9gs4vKy7x89uV": "starter",
  "prod_U9gsge4Z6Q7ztW": "pro",
};

const log = (step: string, details?: unknown) =>
  console.log(
    `[STRIPE-WEBHOOK] ${step}${details ? ` — ${JSON.stringify(details)}` : ""}`
  );

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: JSON_HEADERS,
    });
  }

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!stripeKey || !webhookSecret) {
    log("ERROR", {
      reason: "Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET",
    });
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response(JSON.stringify({ error: "Missing stripe-signature" }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );
  } catch (err) {
    log("Signature verification failed", { error: err.message });
    return new Response(
      JSON.stringify({ error: `Webhook signature failed: ${err.message}` }),
      { status: 400, headers: JSON_HEADERS }
    );
  }

  log("Received event", { type: event.type, id: event.id });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // ── Helper: find profile by Stripe customer email ─────────────────────────
  async function findProfileByCustomer(customerId: string) {
    const customer = (await stripe.customers.retrieve(
      customerId
    )) as Stripe.Customer;
    if (!customer?.email) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, subscription_status, subscription_end")
      .eq("email", customer.email)
      .maybeSingle();

    return profile;
  }

  // ── Helper: safe profile update (respects promo grants) ───────────────────
  // When a Stripe event fires for an active subscription, always update.
  // When a Stripe event fires for a DELETED subscription, only set 'expired'
  // if the user doesn't have a currently active promo grant.
  async function updateProfileStripe(
    userId: string,
    fields: {
      subscription_status: string;
      subscription_plan?: string | null;
      subscription_end?: string | null;
      stripe_customer_id?: string;
    },
    isDestructive: boolean = false
  ) {
    if (isDestructive) {
      // Fetch current profile to check for active promo grant
      const { data: current } = await supabase
        .from("profiles")
        .select("subscription_status, subscription_end")
        .eq("id", userId)
        .maybeSingle();

      const now = new Date();
      const hasActiveGrant =
        current?.subscription_status === "granted" &&
        current?.subscription_end &&
        new Date(current.subscription_end) > now;

      if (hasActiveGrant) {
        log("Skipping destructive Stripe update — active promo grant exists", {
          userId,
        });
        return;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update(fields)
      .eq("id", userId);

    if (error) {
      log("Profile update failed", { userId, error: error.message });
    } else {
      log("Profile updated", { userId, ...fields });
    }
  }

  try {
    switch (event.type) {
      // ── checkout.session.completed ─────────────────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        const profile = await findProfileByCustomer(customerId);
        if (!profile) {
          log("No profile found for customer", { customerId });
          break;
        }

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const productId = sub.items.data[0]?.price?.product as string;
        const plan = PRODUCT_TO_PLAN[productId] ?? "starter";
        const isTrialing = sub.status === "trialing";
        const subEnd = new Date(sub.current_period_end * 1000).toISOString();

        // A successful checkout always wins — Stripe active/trialing overrides promo
        await updateProfileStripe(
          profile.id,
          {
            subscription_status: isTrialing ? "trialing" : "active",
            subscription_plan: plan,
            subscription_end: subEnd,
            stripe_customer_id: customerId,
          },
          false // not destructive
        );
        break;
      }

      // ── customer.subscription.updated ─────────────────────────────────────
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const profile = await findProfileByCustomer(customerId);
        if (!profile) {
          log("No profile found for customer", { customerId });
          break;
        }

        const productId = sub.items.data[0]?.price?.product as string;
        const plan = PRODUCT_TO_PLAN[productId] ?? "starter";
        const isTrialing = sub.status === "trialing";
        const isActive = sub.status === "active";
        const subEnd = new Date(sub.current_period_end * 1000).toISOString();

        let status: string;
        if (isTrialing) status = "trialing";
        else if (isActive) status = "active";
        else status = sub.status;

        // Non-destructive: active/trialing Stripe sub always wins
        await updateProfileStripe(
          profile.id,
          {
            subscription_status: status,
            subscription_plan: plan,
            subscription_end: subEnd,
            stripe_customer_id: customerId,
          },
          false
        );
        break;
      }

      // ── customer.subscription.deleted ─────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const customerId = sub.customer as string;

        const profile = await findProfileByCustomer(customerId);
        if (!profile) {
          log("No profile found for customer", { customerId });
          break;
        }

        // DESTRUCTIVE: only set 'expired' if no active promo grant
        await updateProfileStripe(
          profile.id,
          {
            subscription_status: "expired",
            subscription_plan: null,
            subscription_end: null,
          },
          true // destructive — will check for promo grant first
        );
        break;
      }

      // ── invoice.payment_failed ─────────────────────────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const profile = await findProfileByCustomer(customerId);
        if (!profile) {
          log("No profile found for customer", { customerId });
          break;
        }

        // DESTRUCTIVE: only if no active promo grant
        await updateProfileStripe(
          profile.id,
          { subscription_status: "payment_failed" },
          true
        );
        break;
      }

      default:
        log("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    log("Handler error", { message: error.message });
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
});
