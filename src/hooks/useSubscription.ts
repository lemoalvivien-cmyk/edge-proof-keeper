/**
 * useSubscription
 * Checks Stripe subscription status for the authenticated user.
 * Auto-refreshes on mount and can be manually refreshed.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionState {
  isLoading: boolean;
  subscribed: boolean;
  plan: "starter" | "pro" | "enterprise" | null;
  trialActive: boolean;
  trialEnd: string | null;
  subscriptionEnd: string | null;
  refresh: () => void;
}

export function useSubscription(): SubscriptionState {
  const [isLoading, setIsLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [plan, setPlan] = useState<"starter" | "pro" | "enterprise" | null>(null);
  const [trialActive, setTrialActive] = useState(false);
  const [trialEnd, setTrialEnd] = useState<string | null>(null);
  const [subscriptionEnd, setSubscriptionEnd] = useState<string | null>(null);

  const check = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setSubscribed(data?.subscribed ?? false);
      setPlan(data?.plan ?? null);
      setTrialActive(data?.trial_active ?? false);
      setTrialEnd(data?.trial_end ?? null);
      setSubscriptionEnd(data?.subscription_end ?? null);
    } catch {
      setSubscribed(false);
      setPlan(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  return { isLoading, subscribed, plan, trialActive, trialEnd, subscriptionEnd, refresh: check };
}

/** Redirect to Stripe Checkout for a given plan */
export async function openCheckout(plan: "starter" | "pro") {
  try {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { plan },
    });
    if (error) throw error;
    if (data?.url) {
      window.open(data.url, "_blank", "noopener,noreferrer");
    }
  } catch (e) {
    console.error("openCheckout error:", e);
    throw e;
  }
}

/** Payment links (static fallback for unauthenticated visitors) */
export const PAYMENT_LINKS = {
  starter: "https://buy.stripe.com/9B628rbgjfrz19Z0Cz8N201",
  pro: "https://buy.stripe.com/cNidR9bgj1AJ2e3clh8N202",
} as const;
