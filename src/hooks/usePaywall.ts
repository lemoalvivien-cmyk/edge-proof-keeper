/**
 * usePaywall — wraps useEntitlement and returns a PaywallGate component.
 * Usage in protected pages:
 *
 *   const { PaywallGate } = usePaywall();
 *   return <PaywallGate><YourPage /></PaywallGate>;
 */
import React from "react";
import { useEntitlement } from "@/hooks/useEntitlement";
import { UpgradeWall } from "@/components/ui/UpgradeWall";
import { Loader2 } from "lucide-react";

export function usePaywall() {
  const { isLoading, entitled, trialActive, plan } = useEntitlement();

  const PaywallGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (isLoading) {
      return (
        React.createElement("div", { className: "flex h-screen items-center justify-center" },
          React.createElement(Loader2, { className: "h-8 w-8 animate-spin text-primary" })
        )
      );
    }
    if (!entitled) {
      return React.createElement(UpgradeWall, { trialActive, plan });
    }
    return React.createElement(React.Fragment, null, children);
  };

  return { isLoading, entitled, plan, trialActive, PaywallGate };
}
