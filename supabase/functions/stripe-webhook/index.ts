/**
 * stripe-webhook
 * Handles Stripe events: checkout.session.completed,
 * customer.subscription.updated, customer.subscription.deleted,
 * invoice.payment_failed.
 * verify_jwt = false — secured by Stripe webhook signature.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

// Webhook responses don't need CORS (Stripe → server, not browser)
const JSON_HEADERS = { "Content-Type": "application/json" };

const PRODUCT_TO_PLAN: Record<string, string> = {
  "prod_U9gs4vKy7x89uV": "starter",
  "prod_U9gsge4Z6Q7ztW": "pro",
};

const log = (step: string, details?: unknown) =>
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` — ${JSON.stringify(details)}` : ""}`);

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
    log("ERROR", { reason: "Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET" });
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

  // ── Verify Stripe signature ────────────────────────────────────────────────
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
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
  } catch (err) {
    log("Signature verification failed", { error: err.message });
    return new Response(JSON.stringify({ error: `Webhook signature failed: ${err.message}` }), {
      status: 400,
      headers: JSON_HEADERS,
    });
  }

  log("Received event", { type: event.type, id: event.id });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  // ── Helper: find profile by Stripe customer email ─────────────────────────
  async function findProfileByCustomer(customerId: string) {
    const customer = await stripe.customers.retrieve(customerId) as Stripe.Customer;
    if (!customer?.email) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", customer.email)
      .maybeSingle();

    return profile;
  }

  // ── Helper: update profile subscription fields ────────────────────────────
  async function updateProfile(
    userId: string,
    fields: {
      subscription_status: string;
      subscription_plan?: string | null;
      subscription_end?: string | null;
      stripe_customer_id?: string;
    }
  ) {
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

  // ── Event handlers ─────────────────────────────────────────────────────────
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

        // Fetch subscription to get status + trial info
        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const productId = sub.items.data[0]?.price?.product as string;
        const plan = PRODUCT_TO_PLAN[productId] ?? "starter";
        const isTrialing = sub.status === "trialing";
        const subEnd = new Date(sub.current_period_end * 1000).toISOString();

        await updateProfile(profile.id, {
          subscription_status: isTrialing ? "trialing" : "active",
          subscription_plan: plan,
          subscription_end: subEnd,
          stripe_customer_id: customerId,
        });
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
        else status = sub.status; // paused, past_due, etc.

        await updateProfile(profile.id, {
          subscription_status: status,
          subscription_plan: plan,
          subscription_end: subEnd,
          stripe_customer_id: customerId,
        });
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

        await updateProfile(profile.id, {
          subscription_status: "expired",
          subscription_plan: null,
          subscription_end: null,
        });
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

        await updateProfile(profile.id, {
          subscription_status: "payment_failed",
        });
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
