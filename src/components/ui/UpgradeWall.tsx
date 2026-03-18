/**
 * UpgradeWall — Full-screen paywall shown when subscription is not active.
 * Displayed on all protected pages when entitled === false.
 */
import { Shield, Zap, Lock, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openCheckout } from "@/hooks/useSubscription";
import { useState } from "react";

interface UpgradeWallProps {
  trialActive?: boolean;
  plan?: string | null;
}

export function UpgradeWall({ trialActive, plan }: UpgradeWallProps) {
  const [loading, setLoading] = useState<"starter" | "pro" | null>(null);

  const handleCheckout = async (p: "starter" | "pro") => {
    setLoading(p);
    try {
      await openCheckout(p);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm p-6">
      {/* Lock icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
        <Lock className="h-10 w-10 text-primary" />
      </div>

      <h1 className="text-3xl font-bold text-center mb-2">Accès réservé aux abonnés</h1>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        {trialActive
          ? "Votre essai a expiré. Choisissez un plan pour continuer à accéder à SECURIT-E."
          : "Cette fonctionnalité est disponible avec un abonnement actif. Essai gratuit 14 jours, sans CB requise."}
      </p>

      {/* Plans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mb-8">
        {/* Starter */}
        <div className="relative flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold text-lg">Starter</span>
          </div>
          <p className="text-3xl font-bold">
            490 €<span className="text-sm font-normal text-muted-foreground">/an TTC</span>
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 flex-1">
            <li>✓ Findings & Risk register</li>
            <li>✓ Remediation tasks</li>
            <li>✓ Evidence vault</li>
            <li>✓ Rapports automatisés</li>
          </ul>
          <Button
            className="mt-2 gap-2"
            onClick={() => handleCheckout("starter")}
            disabled={loading !== null}
          >
            {loading === "starter" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            Commencer l'essai
          </Button>
        </div>

        {/* Pro */}
        <div className="relative flex flex-col gap-3 rounded-xl border-2 border-primary bg-card p-6">
          <div className="absolute -top-3 left-4 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
            Recommandé
          </div>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-semibold text-lg">Pro</span>
          </div>
          <p className="text-3xl font-bold">
            6 900 €<span className="text-sm font-normal text-muted-foreground">/an TTC</span>
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 flex-1">
            <li>✓ Tout Starter inclus</li>
            <li>✓ Sovereign AI agent</li>
            <li>✓ Proof Packs certifiés</li>
            <li>✓ Multi-org & MSSP</li>
          </ul>
          <Button
            className="mt-2 gap-2"
            variant="default"
            onClick={() => handleCheckout("pro")}
            disabled={loading !== null}
          >
            {loading === "pro" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Zap className="h-4 w-4" />
            )}
            Passer au Pro
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Paiement sécurisé via Stripe · Annulation à tout moment · Support inclus
      </p>
    </div>
  );
}
