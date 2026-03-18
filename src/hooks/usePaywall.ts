/**
 * usePaywall — wraps useEntitlement and returns a PaywallGate component.
 */
import { useEntitlement } from "@/hooks/useEntitlement";
import { UpgradeWall } from "@/components/ui/UpgradeWall";
import { Loader2 } from "lucide-react";

interface PaywallGateProps {
  children: React.ReactNode;
}

export function PaywallGate({ children }: PaywallGateProps) {
  const { isLoading, entitled, trialActive, plan } = useEntitlement();

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

export function usePaywall() {
  const { isLoading, entitled, trialActive, plan } = useEntitlement();
  return { isLoading, entitled, plan, trialActive };
}
