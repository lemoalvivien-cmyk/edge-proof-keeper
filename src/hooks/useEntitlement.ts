/**
 * useEntitlement
 * Server-side paywall check: calls check-entitlement edge function.
 * Returns { entitled, plan, trialActive, trialEnd, isLoading }.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface EntitlementState {
  isLoading: boolean;
  entitled: boolean;
  plan: "starter" | "pro" | "enterprise" | null;
  trialActive: boolean;
  trialEnd: string | null;
  refresh: () => void;
}

export function useEntitlement(): EntitlementState {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [entitled, setEntitled] = useState(false);
  const [plan, setPlan] = useState<"starter" | "pro" | "enterprise" | null>(null);
  const [trialActive, setTrialActive] = useState(false);
  const [trialEnd, setTrialEnd] = useState<string | null>(null);

  const check = useCallback(async () => {
    if (!user) {
      setIsLoading(false);
      setEntitled(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-entitlement");
      if (error) throw error;
      setEntitled(data?.entitled ?? false);
      setPlan(data?.plan ?? null);
      setTrialActive(data?.trial_active ?? false);
      setTrialEnd(data?.trial_end ?? null);
    } catch {
      setEntitled(false);
      setPlan(null);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    check();
  }, [check]);

  return { isLoading, entitled, plan, trialActive, trialEnd, refresh: check };
}
