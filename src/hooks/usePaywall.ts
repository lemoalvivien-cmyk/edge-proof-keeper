/**
 * usePaywall — wraps useEntitlement and returns a <PaywallGate> component.
 * Usage in protected pages:
 *
 *   const { PaywallGate } = usePaywall();
 *   return <PaywallGate><YourPage /></PaywallGate>;
 */
import { useEntitlement } from "@/hooks/useEntitlement";
import { UpgradeWall } from "@/components/ui/UpgradeWall";
import { Loader2 } from "lucide-react";

export function usePaywall() {
  const { isLoading, entitled, trialActive, plan } = useEntitlement();

  function PaywallGate({ children }: { children: React.ReactNode }) {
    if (isLoading) {
      return (
        <div className="flex h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    if (!entitled) {
      return <UpgradeWall trialActive={trialActive} plan={plan} />;
    }
    return <>{children}</>;
  }

  return { isLoading, entitled, plan, trialActive, PaywallGate };
}
