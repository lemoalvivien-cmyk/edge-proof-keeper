/**
 * UpgradeWall — Premium paywall with loss-framing and value conversion.
 * Shown when entitled === false. Designed to convert fast.
 *
 * Psychology:
 *   1. Loss framing — what you're already missing
 *   2. Accumulated value — prove sunk cost
 *   3. Urgency — business risk is real, delay costs
 *   4. Easy path — one-click checkout + code fallback
 */
import {
  Shield, Zap, Lock, ArrowRight, Loader2, Key, ChevronDown, ChevronUp,
  Crown, AlertTriangle, TrendingDown, Clock, Check, X, FileText, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { openCheckout } from "@/hooks/useSubscription";
import { useState, useEffect } from "react";
import { AccessCodeActivation } from "@/components/auth/AccessCodeActivation";
import { useNavigate } from "react-router-dom";
import { useEntitlement } from "@/hooks/useEntitlement";
import { motion, AnimatePresence } from "framer-motion";
import { trackEvent } from "@/lib/tracking";

interface UpgradeWallProps {
  trialActive?: boolean;
  plan?: string | null;
}

const LOCKED_FEATURES = [
  { icon: Activity, label: "6 Agents IA supervisés 24/7 — détection en continu" },
  { icon: Lock, label: "Evidence Vault SHA-256 Merkle — preuves immuables exportables" },
  { icon: Shield, label: "Score de risque temps réel + dashboard Direction" },
  { icon: FileText, label: "Brief CODIR mensuel généré par votre RSSI Virtuel IA" },
  { icon: Zap, label: "Remédiation assistée — cible < 4h avec validation Go/No-Go" },
  { icon: TrendingDown, label: "Conformité RGPD / NIS2 documentée et défendable" },
];

const URGENCY_STATS = [
  { icon: TrendingDown, val: "< 4h", label: "cible de remédiation assistée" },
  { icon: Shield, val: "🇫🇷 France", label: "hébergé en France" },
  { icon: Clock, val: "47s", label: "cycle détection → preuve (lab)" },
];

const PLANS = [
  {
    id: "starter" as const,
    name: "Sentinel",
    price: "490€",
    period: "/an",
    monthly: "40,83€/mois",
    label: "Démarrage",
    labelColor: "text-primary",
    icon: Shield,
    iconColor: "text-primary",
    borderClass: "border-border",
    features: [
      "Scout Agent — surface d'attaque",
      "Dashboard Direction + Technique",
      "Evidence Vault SHA-256",
      "Conformité RGPD / NIS2 documentée",
    ],
    ctaLabel: "Activer Sentinel — 490€",
    ctaVariant: "outline" as const,
  },
  {
    id: "pro" as const,
    name: "Command",
    price: "6 900€",
    period: "/an",
    monthly: "575€/mois · 5,75% d'un RSSI",
    label: "★ Recommandé DSI",
    labelColor: "text-accent",
    icon: Zap,
    iconColor: "text-accent",
    borderClass: "border-accent/60 border-2",
    features: [
      "6 Agents IA Swarm supervisés 24/7",
      "Remédiation assistée < 4h",
      "RSSI Virtuel IA — brief CODIR",
      "Evidence Vault + OSINT continu",
      "Tout Sentinel inclus",
    ],
    ctaLabel: "Activer Command — 6 900€",
    ctaVariant: "default" as const,
    featured: true,
  },
  {
    id: "enterprise" as const,
    name: "Sovereign",
    price: "29 900€",
    period: "/an",
    monthly: "Sur devis · On-premise",
    label: "Enterprise",
    labelColor: "text-warning",
    icon: Crown,
    iconColor: "text-warning",
    borderClass: "border-border",
    features: [
      "Tout Command inclus",
      "Déploiement on-premise",
      "Account Manager CISO dédié",
      "SLA contractualisé",
    ],
    ctaLabel: "Parler à l'équipe",
    ctaVariant: "outline" as const,
    contactOnly: true,
  },
];

export function UpgradeWall({ trialActive, plan }: UpgradeWallProps) {
  const [loading, setLoading] = useState<"starter" | "pro" | null>(null);
  const [showCodePanel, setShowCodePanel] = useState(false);
  const navigate = useNavigate();
  const { refresh } = useEntitlement();

  // Track upgrade wall impression once on mount
  useEffect(() => {
    trackEvent('upgrade_wall_seen', {
      source_page: window.location.pathname,
      cta_origin: 'upgrade_wall',
      metadata: { trial_active: trialActive, current_plan: plan },
    });
  }, [trialActive, plan]);

  const handleCheckout = async (p: "starter" | "pro") => {
    trackEvent('upgrade_wall_plan_selected', {
      source_page: window.location.pathname,
      cta_origin: `upgrade_wall_${p}`,
    });
    setLoading(p);
    try {
      await openCheckout(p);
    } finally {
      setLoading(null);
    }
  };

  const handleCodeSuccess = (_accessUntil: string, _grantedPlan: string) => {
    trackEvent('access_code_activated', { source_page: window.location.pathname, cta_origin: 'upgrade_wall_code' });
    setTimeout(async () => {
      await refresh();
      navigate("/dashboard", { replace: true });
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/97 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-4xl mx-auto space-y-8 py-10">

        {/* ── Loss framing header ───────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 border-2 border-destructive/30 flex items-center justify-center mb-2">
            <Lock className="w-8 h-8 text-destructive" />
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-destructive/10 border border-destructive/25 text-destructive text-xs font-bold uppercase tracking-widest">
            <AlertTriangle className="w-3 h-3" />
            {trialActive ? "Essai terminé" : "Accès suspendu"}
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight">
            {trialActive
              ? "Votre essai a expiré."
              : "Votre surface d'attaque est exposée."}
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            {trialActive
              ? "Pendant votre essai, vos agents ont détecté des risques réels. Chaque heure sans surveillance active est une fenêtre d'opportunité pour un attaquant."
              : "Sans surveillance active, chaque heure qui passe augmente votre exposition. Reprenez le contrôle — votre première ligne de défense vous attend."}
          </p>
        </motion.div>

        {/* ── Urgency stats ─────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="grid grid-cols-3 gap-3 max-w-xl mx-auto">
          {URGENCY_STATS.map((s, i) => (
            <div key={i} className="p-3 rounded-xl bg-card border border-border/60 text-center">
              <s.icon className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-xl font-black font-mono text-primary">{s.val}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── What you're missing ───────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card/60 border border-border rounded-2xl p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
            Ce que vous n'avez plus — et ce que ça coûte
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {LOCKED_FEATURES.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center justify-center flex-shrink-0">
                  <X className="w-3.5 h-3.5 text-destructive" />
                </div>
                <span className="text-sm text-muted-foreground">{item.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl bg-destructive/5 border border-destructive/20 text-center">
            <p className="text-xs text-destructive font-semibold">
              Coût moyen d'un incident cyber en France (CESIN) : <span className="font-black">≥ 180 000€</span>
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Investissement annuel pour vous en protéger : à partir de <strong>490€/an</strong>
            </p>
          </div>
        </motion.div>

        {/* ── Plans ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="grid sm:grid-cols-3 gap-4">
          {PLANS.map((p) => {
            const PIcon = p.icon;
            return (
              <div
                key={p.id}
                className={`relative rounded-2xl border bg-card p-5 flex flex-col ${p.borderClass} ${
                  p.featured ? "shadow-[0_0_30px_hsl(258_90%_66%_/_0.15)]" : ""
                }`}
              >
                {p.featured && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                    ★ Recommandé DSI
                  </div>
                )}
                <div className="flex items-center gap-2 mb-3 mt-1">
                  <PIcon className={`w-5 h-5 ${p.iconColor}`} />
                  <span className="font-bold text-foreground">{p.name}</span>
                  <span className={`ml-auto text-[10px] font-bold ${p.labelColor} uppercase`}>{p.label}</span>
                </div>
                <div className="text-3xl font-black mb-0.5">{p.price}<span className="text-sm font-normal text-muted-foreground">{p.period}</span></div>
                <p className="text-xs text-muted-foreground mb-4">{p.monthly}</p>
                <ul className="space-y-1.5 text-xs text-muted-foreground flex-1 mb-5">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <Check className="w-3 h-3 text-success flex-shrink-0 mt-0.5" />{f}
                    </li>
                  ))}
                </ul>
                {p.contactOnly ? (
                  <Button className="w-full gap-1.5 font-bold" variant="outline" onClick={() => navigate("/pricing")}>
                    <ArrowRight className="w-4 h-4" />
                    Parler à l'équipe
                  </Button>
                ) : (
                  <>
                    <Button
                      className={`w-full gap-1.5 font-bold ${p.featured ? "bg-accent hover:bg-accent/90 text-accent-foreground shadow-[0_0_15px_hsl(258_90%_66%_/_0.3)]" : ""}`}
                      variant={p.ctaVariant}
                      disabled={loading !== null}
                      onClick={() => handleCheckout(p.id as "starter" | "pro")}
                    >
                      {loading === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                      {p.ctaLabel}
                    </Button>
                    <p className="text-[10px] text-center text-muted-foreground mt-2">14j gratuits · Carte requise · Stripe · Annulation libre</p>
                  </>
                )}
              </div>
            );
          })}
        </motion.div>

        {/* ── Access Code ───────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="max-w-md mx-auto w-full">
          <button
            type="button"
            onClick={() => {
              const next = !showCodePanel;
              setShowCodePanel(next);
              if (next) trackEvent('upgrade_wall_code_opened', { source_page: window.location.pathname, cta_origin: 'upgrade_wall' });
            }}
            className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 border border-dashed border-border rounded-xl hover:border-primary/40"
          >
            <Key className="w-4 h-4" />
            J'ai un code d'accès premium
            {showCodePanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <AnimatePresence>
            {showCodePanel && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                <div className="mt-3 rounded-xl border border-border bg-card/60 p-5">
                  <p className="text-sm text-muted-foreground mb-3 text-center">
                    Entrez votre code pour activer l'accès premium instantanément.
                  </p>
                  <AccessCodeActivation onSuccess={handleCodeSuccess} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <p className="text-xs text-muted-foreground text-center pb-4">
          Paiement sécurisé via Stripe · Annulation à tout moment · Support inclus · Données hébergées en France 🇫🇷
        </p>
      </div>
    </div>
  );
}
