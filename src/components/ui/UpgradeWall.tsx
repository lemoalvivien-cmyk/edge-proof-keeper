/**
 * UpgradeWall — Premium paywall with value-loss framing.
 * Shown when entitled === false. Designed to convert fast.
 */
import {
  Shield, Zap, Lock, ArrowRight, Loader2, Key, ChevronDown, ChevronUp,
  Crown, AlertTriangle, TrendingDown, Clock, Check, X,
} from "lucide-react";
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

const VALUE_ITEMS = [
  "Evidence Vault immuable — preuves SHA-256 + post-quantique",
  "Score de risque temps réel — 6 agents autonomes actifs",
  "Conformité RGPD / NIS2 automatisée et prouvable",
  "Self-healing < 4h — votre RSSI virtuel IA 24/7",
  "Rapports CODIR exportables en 1 clic",
  "Preuves accumulées = capital juridique défendable",
];

const URGENCY_STATS = [
  { icon: TrendingDown, val: "4h", label: "délai moyen de détection réduit" },
  { icon: Shield, val: "99,9%", label: "uptime garanti contractuellement" },
  { icon: Clock, val: "47s", label: "de la détection à la preuve" },
];

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

  const handleCodeSuccess = (_accessUntil: string, _grantedPlan: string) => {
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
              ? "Pendant votre essai, vos agents ont détecté des risques. Activez votre abonnement pour les traiter avant qu'ils deviennent des incidents."
              : "Sans surveillance active, chaque heure qui passe est une opportunité pour un attaquant. SECURIT-E vous redonne le contrôle en moins de 47 secondes."}
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
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Ce que vous perdez sans accès actif</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {VALUE_ITEMS.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-destructive/15 flex items-center justify-center flex-shrink-0">
                  <X className="w-2.5 h-2.5 text-destructive" />
                </div>
                <span className="text-sm text-muted-foreground">{item}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Plans ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="grid sm:grid-cols-3 gap-4">

          {/* Sentinel */}
          <div className="rounded-2xl border border-border bg-card p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-bold text-foreground">Sentinel</span>
              <span className="ml-auto text-[10px] font-bold text-primary uppercase">Démarrage</span>
            </div>
            <div className="text-3xl font-black mb-0.5">490€<span className="text-sm font-normal text-muted-foreground">/an</span></div>
            <p className="text-xs text-muted-foreground mb-4">40,83€ / mois</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground flex-1 mb-5">
              {["Détection surface d'attaque", "Dashboard Direction + Technique", "Evidence Vault SHA-256", "RGPD / NIS2 documentée"].map((f, i) => (
                <li key={i} className="flex items-center gap-1.5"><Check className="w-3 h-3 text-success flex-shrink-0" />{f}</li>
              ))}
            </ul>
            <Button className="w-full gap-1.5 font-bold" variant="outline" disabled={loading !== null} onClick={() => handleCheckout("starter")}>
              {loading === "starter" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Activer — 490€
            </Button>
          </div>

          {/* Command — featured */}
          <div className="relative rounded-2xl border-2 border-accent/60 bg-gradient-to-b from-accent/10 to-card p-5 flex flex-col shadow-[0_0_30px_hsl(258_90%_66%_/_0.15)]">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-accent text-accent-foreground text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
              ★ Recommandé DSI
            </div>
            <div className="flex items-center gap-2 mb-3 mt-1">
              <Zap className="w-5 h-5 text-accent" />
              <span className="font-bold text-foreground">Command</span>
              <span className="ml-auto text-[10px] font-bold text-accent uppercase">Pro</span>
            </div>
            <div className="text-3xl font-black mb-0.5">6 900€<span className="text-sm font-normal text-muted-foreground">/an</span></div>
            <p className="text-xs text-muted-foreground mb-4">575€ / mois · équivaut à 5,75% d'un RSSI</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground flex-1 mb-5">
              {["6 Agents IA autonomes 24/7", "Self-healing < 4h SLA", "RSSI Virtuel IA — brief CODIR", "Evidence post-quantique", "OSINT & EASM continu"].map((f, i) => (
                <li key={i} className="flex items-center gap-1.5"><Check className="w-3 h-3 text-success flex-shrink-0" />{f}</li>
              ))}
            </ul>
            <Button className="w-full gap-1.5 font-bold bg-accent hover:bg-accent/90 text-accent-foreground shadow-[0_0_15px_hsl(258_90%_66%_/_0.3)]" disabled={loading !== null} onClick={() => handleCheckout("pro")}>
              {loading === "pro" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Activer — 6 900€
            </Button>
            <p className="text-[10px] text-center text-muted-foreground mt-2">14j gratuits · Stripe · Annulation libre</p>
          </div>

          {/* Sovereign */}
          <div className="rounded-2xl border border-border bg-card p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5 text-warning" />
              <span className="font-bold text-foreground">Sovereign</span>
              <span className="ml-auto text-[10px] font-bold text-warning uppercase">Enterprise</span>
            </div>
            <div className="text-3xl font-black mb-0.5">29 900€<span className="text-sm font-normal text-muted-foreground">/an</span></div>
            <p className="text-xs text-muted-foreground mb-4">On-premise · Swarm complet</p>
            <ul className="space-y-1.5 text-xs text-muted-foreground flex-1 mb-5">
              {["Tout Command inclus", "Déploiement on-premise certifié", "Account Manager dédié", "SLA 99.99% contractuel", "Formation équipe incluse"].map((f, i) => (
                <li key={i} className="flex items-center gap-1.5"><Check className="w-3 h-3 text-success flex-shrink-0" />{f}</li>
              ))}
            </ul>
            <Button className="w-full gap-1.5 font-bold" variant="outline" onClick={() => navigate("/pricing")}>
              <ArrowRight className="w-4 h-4" />
              Parler à l'équipe
            </Button>
          </div>
        </motion.div>

        {/* ── Access Code ───────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="max-w-md mx-auto w-full">
          <button type="button" onClick={() => setShowCodePanel(v => !v)}
            className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-2 border border-dashed border-border rounded-xl hover:border-primary/40">
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
