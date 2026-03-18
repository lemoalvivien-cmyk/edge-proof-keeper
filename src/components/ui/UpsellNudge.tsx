/**
 * UpsellNudge — Contextual in-product upgrade prompt.
 * Shows ROI-framed upgrade CTA at the right moment in the product flow.
 *
 * Usage: <UpsellNudge feature="sovereign" />
 */
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Lock, Zap, Crown, Shield, TrendingUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { openCheckout } from "@/hooks/useSubscription";
import { trackEvent } from "@/lib/tracking";

export type UpsellFeature =
  | "self_healing"
  | "sovereign"
  | "easm"
  | "proof_pack"
  | "codir_report"
  | "predictive"
  | "export_pdf"
  | "default";

interface NudgeConfig {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  gain: string;
  planRequired: "pro" | "enterprise";
  planName: string;
  planPrice: string;
}

const NUDGE_CONFIGS: Record<UpsellFeature, NudgeConfig> = {
  self_healing: {
    icon: Zap,
    title: "Self-healing autonome — Plan Command",
    description: "Cette vulnérabilité peut être corrigée automatiquement en < 4h. Activez Command pour laisser vos agents travailler sans vous.",
    gain: "Économise ~12h d'intervention manuelle par incident",
    planRequired: "pro",
    planName: "Command",
    planPrice: "6 900€/an",
  },
  sovereign: {
    icon: Crown,
    title: "Déploiement on-premise — Plan Sovereign",
    description: "Cette fonctionnalité est disponible en mode déployé sur votre infrastructure. Zéro dépendance cloud externe.",
    gain: "Souveraineté totale · SecNumCloud objectif roadmap",
    planRequired: "enterprise",
    planName: "Sovereign",
    planPrice: "29 900€/an",
  },
  easm: {
    icon: Shield,
    title: "EASM & OSINT Signals — Plan Command",
    description: "Surveillez votre surface d'attaque externe en continu. Fuites de données, domaines exposés, services non autorisés.",
    gain: "Détecte en moyenne 3 actifs non inventoriés par semaine",
    planRequired: "pro",
    planName: "Command",
    planPrice: "6 900€/an",
  },
  proof_pack: {
    icon: Lock,
    title: "Proof Packs SHA-256 vérifiables — Plan Command",
    description: "Exportez vos preuves cryptographiques SHA-256 Merkle pour vos audits, assureurs et conseils d'administration.",
    gain: "Réduit le temps de préparation d'un audit de 80%",
    planRequired: "pro",
    planName: "Command",
    planPrice: "6 900€/an",
  },
  codir_report: {
    icon: TrendingUp,
    title: "Brief CODIR mensuel IA — Plan Command",
    description: "Rapport exécutif généré par votre RSSI Virtuel IA, personnalisé pour votre direction — sans reformatage manuel.",
    gain: "2h économisées par mois sur la préparation du CODIR",
    planRequired: "pro",
    planName: "Command",
    planPrice: "6 900€/an",
  },
  predictive: {
    icon: TrendingUp,
    title: "Predictive Causality Engine — Plan Command",
    description: "Anticipez les vecteurs d'attaque à 90 jours grâce à l'IA causale. Agissez avant que les risques deviennent des incidents.",
    gain: "Prévention plutôt que réaction",
    planRequired: "pro",
    planName: "Command",
    planPrice: "6 900€/an",
  },
  export_pdf: {
    icon: TrendingUp,
    title: "Export PDF premium — Plan Command",
    description: "Rapports d'audit branded avec hash SHA-256, piste d'audit Merkle, prêts pour vos parties prenantes.",
    gain: "Présentation immédiate sans reformatage",
    planRequired: "pro",
    planName: "Command",
    planPrice: "6 900€/an",
  },
  default: {
    icon: Zap,
    title: "Fonctionnalité Premium",
    description: "Cette fonctionnalité est disponible sur le plan Command. Passez à la vitesse supérieure.",
    gain: "6 agents IA supervisés · Remédiation assistée · Evidence Vault SHA-256",
    planRequired: "pro",
    planName: "Command",
    planPrice: "6 900€/an",
  },
};

interface UpsellNudgeProps {
  feature?: UpsellFeature;
  /** inline = banner inside content; modal = centered overlay */
  variant?: "inline" | "modal" | "banner";
  onDismiss?: () => void;
  className?: string;
}

export function UpsellNudge({
  feature = "default",
  variant = "inline",
  onDismiss,
  className = "",
}: UpsellNudgeProps) {
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const config = NUDGE_CONFIGS[feature];
  const NudgeIcon = config.icon;

  const handleUpgrade = async () => {
    if (config.planRequired === "enterprise") {
      navigate("/pricing");
      return;
    }
    setLoading(true);
    try {
      await openCheckout("pro");
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed) return null;

  if (variant === "banner") {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className={`rounded-xl border border-accent/30 bg-gradient-to-r from-accent/8 to-primary/5 p-3.5 flex items-center justify-between gap-3 flex-wrap ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent/15 flex items-center justify-center flex-shrink-0">
              <NudgeIcon className="w-4 h-4 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-sm text-foreground">{config.title}</p>
              <p className="text-xs text-muted-foreground">{config.gain}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-1.5 font-bold bg-accent hover:bg-accent/90 text-accent-foreground" disabled={loading} onClick={handleUpgrade}>
              {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
              Activer {config.planName}
            </Button>
            <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground transition-colors p-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (variant === "inline") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative rounded-xl border border-accent/25 bg-card/80 p-5 space-y-3 ${className}`}
      >
        <button onClick={handleDismiss} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/15 flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-bold text-sm text-foreground">{config.title}</p>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{config.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/8 border border-success/20">
          <TrendingUp className="w-3.5 h-3.5 text-success flex-shrink-0" />
          <span className="text-xs text-success font-medium">{config.gain}</span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Plan requis</p>
            <p className="font-bold text-sm text-foreground">{config.planName} — {config.planPrice}</p>
          </div>
          <Button size="sm" className="gap-1.5 font-bold bg-accent hover:bg-accent/90 text-accent-foreground" disabled={loading} onClick={handleUpgrade}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            Activer
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </motion.div>
    );
  }

  // modal variant
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full max-w-md rounded-2xl border border-accent/40 bg-card p-6 shadow-2xl space-y-4"
      >
        <button onClick={handleDismiss} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-accent/15 flex items-center justify-center">
            <Lock className="w-6 h-6 text-accent" />
          </div>
          <div>
            <p className="font-black text-lg text-foreground leading-tight">{config.title.split("—")[0].trim()}</p>
            <p className="text-xs text-accent font-semibold">Plan {config.planName} requis</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">{config.description}</p>

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-success/8 border border-success/20">
          <TrendingUp className="w-3.5 h-3.5 text-success flex-shrink-0" />
          <span className="text-xs text-success font-medium">{config.gain}</span>
        </div>

        <div className="space-y-2">
          <Button className="w-full gap-2 font-bold bg-accent hover:bg-accent/90 text-accent-foreground" disabled={loading} onClick={handleUpgrade}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Passer au plan {config.planName} — {config.planPrice}
          </Button>
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleDismiss}>
            Plus tard
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

/**
 * LockedFeatureOverlay — Shows blurred content with an upgrade CTA on top.
 * Wrap any premium feature block with this.
 */
interface LockedFeatureOverlayProps {
  feature?: UpsellFeature;
  children: React.ReactNode;
  label?: string;
}

export function LockedFeatureOverlay({ feature = "default", children, label }: LockedFeatureOverlayProps) {
  const [showNudge, setShowNudge] = useState(false);
  const config = NUDGE_CONFIGS[feature];
  const NudgeIcon = config.icon;

  return (
    <div className="relative rounded-xl overflow-hidden">
      {/* Blurred content */}
      <div className="select-none pointer-events-none blur-sm opacity-50 saturate-50">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] p-6 text-center space-y-3">
        <div className="w-10 h-10 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center">
          <Lock className="w-5 h-5 text-accent" />
        </div>
        <div>
          <p className="font-bold text-foreground text-sm">{label ?? config.title.split("—")[0].trim()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Plan {config.planName} requis</p>
        </div>
        <Button size="sm" className="gap-1.5 font-bold bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => setShowNudge(true)}>
          <NudgeIcon className="w-3.5 h-3.5" />
          Voir cette fonctionnalité
        </Button>
      </div>

      {showNudge && (
        <UpsellNudge feature={feature} variant="modal" onDismiss={() => setShowNudge(false)} />
      )}
    </div>
  );
}
