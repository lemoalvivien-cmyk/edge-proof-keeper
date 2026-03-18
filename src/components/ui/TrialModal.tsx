/**
 * TrialModal — shown after demo/first analysis to convert user to paid plan
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, CheckCircle2, Shield, ArrowRight, X, Star, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openCheckout } from "@/hooks/useSubscription";
import { toast } from "sonner";

interface TrialModalProps {
  open: boolean;
  onClose: () => void;
  /** Show after demo = true, after regular analysis = false */
  afterDemo?: boolean;
}

export function TrialModal({ open, onClose, afterDemo = false }: TrialModalProps) {
  const [loading, setLoading] = useState<"starter" | "pro" | null>(null);

  async function handleCheckout(plan: "starter" | "pro") {
    setLoading(plan);
    try {
      await openCheckout(plan);
      onClose();
    } catch {
      toast.error("Erreur lors de l'ouverture du checkout. Réessayez dans un instant.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: "blur(8px)", background: "hsl(var(--background) / 0.7)" }}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden relative"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Gradient header */}
            <div className="relative overflow-hidden px-6 pt-8 pb-6 text-center"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.15) 0%, hsl(var(--accent) / 0.10) 100%)" }}>
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.2) 0%, transparent 60%)" }} />

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: "spring" }}
                className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 border border-primary/30 mb-4"
              >
                <Zap className="w-7 h-7 text-primary" />
              </motion.div>

              <h2 className="text-2xl font-bold text-foreground">
                {afterDemo ? "Votre essai 14 jours est activé !" : "Analyse assistée complète !"}
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                {afterDemo
                  ? "La démo 47s vient de s'exécuter. Activez votre plan pour accéder à vos vraies données."
                  : "Passez au plan payant pour bénéficier de toutes les fonctionnalités."}
              </p>

              {/* Trial badge */}
              <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full bg-success/10 border border-success/30 text-success text-sm font-semibold">
                <Clock className="w-4 h-4" />
                14 jours d'essai — carte requise — annulation libre
              </div>
            </div>

            {/* Plans */}
            <div className="p-6 space-y-3">
              {/* Starter CTA */}
              <div className="rounded-xl border border-border bg-secondary/20 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <span className="font-bold text-foreground">Starter</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">490 € / an</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Détection + Dashboard + Conformité RGPD/NIS2</p>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">40,83 € / mois</span>
                </div>
                <Button
                  className="w-full gap-2 font-bold"
                  variant="outline"
                  disabled={loading !== null}
                  onClick={() => handleCheckout("starter")}
                >
                  {loading === "starter" ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <Zap className="w-4 h-4" />
                    </motion.div>
                  ) : <CheckCircle2 className="w-4 h-4" />}
                  Passer au plan Starter — 490 € / an
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Pro CTA (highlighted) */}
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 pointer-events-none"
                  style={{ background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 70%)" }} />
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-accent" />
                      <span className="font-bold text-foreground">Pro</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent font-medium border border-accent/30">
                        CASH ENGINE
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">6 900 € / an</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">6 Agents IA + Self-healing 4h + Evidence SHA-256 Vault</p>
                  </div>
                </div>
                <Button
                  className="w-full gap-2 font-bold neon-glow"
                  disabled={loading !== null}
                  onClick={() => handleCheckout("pro")}
                >
                  {loading === "pro" ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                      <Zap className="w-4 h-4" />
                    </motion.div>
                  ) : <Star className="w-4 h-4" />}
                  Activer Pro — 6 900 € / an
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>

              {/* Trust row */}
              <div className="flex items-center justify-center gap-4 pt-1 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-success" /> Paiement Stripe sécurisé
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-success" /> Satisfait ou remboursé 30j
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-primary" /> 14j gratuits
                </span>
              </div>

              <button
                onClick={onClose}
                className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center mt-1"
              >
                Continuer sans passer à un plan payant →
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
