/**
 * UpgradeWall — Full-screen paywall shown when subscription is not active.
 * Displayed on all protected pages when entitled === false.
 * Includes a secondary CTA for premium access code redemption.
 */
import { Shield, Zap, Lock, ArrowRight, Loader2, Key, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openCheckout } from "@/hooks/useSubscription";
import { useState } from "react";
import { AccessCodeActivation } from "@/components/auth/AccessCodeActivation";
import { useNavigate } from "react-router-dom";
import { useEntitlement } from "@/hooks/useEntitlement";
import { motion, AnimatePresence } from "framer-motion";

interface UpgradeWallProps {
  trialActive?: boolean;
  plan?: string | null;
}

export function UpgradeWall({ trialActive, plan }: UpgradeWallProps) {
  const [loading, setLoading] = useState<"starter" | "pro" | null>(null);
  const [showCodePanel, setShowCodePanel] = useState(false);
  const navigate = useNavigate();
  const { refresh } = useEntitlement();

  const handleCheckout = async (p: "starter" | "pro") => {
    setLoading(p);
    try {
      await openCheckout(p);
    } finally {
      setLoading(null);
    }
  };

  const handleCodeSuccess = (accessUntil: string, grantedPlan: string) => {
    // Refresh entitlement then navigate to dashboard
    setTimeout(async () => {
      await refresh();
      navigate("/dashboard", { replace: true });
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm p-6 overflow-y-auto">
      {/* Lock icon */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 ring-2 ring-primary/20">
        <Lock className="h-10 w-10 text-primary" />
      </div>

      <h1 className="text-3xl font-bold text-center mb-2">
        Accès réservé aux abonnés
      </h1>
      <p className="text-muted-foreground text-center max-w-md mb-8">
        {trialActive
          ? "Votre essai a expiré. Choisissez un plan pour continuer à accéder à SECURIT-E."
          : "Cette fonctionnalité est disponible avec un abonnement actif. Essai 14j — carte requise — annulation libre."}
      </p>

      {/* Plans */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl mb-6">
        {/* Starter */}
        <div className="relative flex flex-col gap-3 rounded-xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="font-semibold text-lg">Starter</span>
          </div>
          <p className="text-3xl font-bold">
            490 €
            <span className="text-sm font-normal text-muted-foreground">
              /an TTC
            </span>
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
            6 900 €
            <span className="text-sm font-normal text-muted-foreground">
              /an TTC
            </span>
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

      {/* Access Code CTA */}
      <div className="w-full max-w-2xl mb-6">
        <button
          type="button"
          onClick={() => setShowCodePanel(!showCodePanel)}
          className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 border border-dashed border-border rounded-lg hover:border-primary/40"
        >
          <Key className="h-4 w-4" />
          J'ai un code d'accès premium
          {showCodePanel ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        <AnimatePresence>
          {showCodePanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 rounded-xl border border-border bg-card/60 p-5">
                <p className="text-sm text-muted-foreground mb-3 text-center">
                  Entrez votre code d'accès pour activer votre accès premium
                  instantanément.
                </p>
                <AccessCodeActivation onSuccess={handleCodeSuccess} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Paiement sécurisé via Stripe · Annulation à tout moment · Support inclus
      </p>
    </div>
  );
}
