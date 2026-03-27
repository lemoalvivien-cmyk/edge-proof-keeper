import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Check, ArrowRight, Sparkles, CalendarDays, Zap, Crown, Shield, Clock, CreditCard, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { TrialModal } from "@/components/ui/TrialModal";
import { openCheckout, PAYMENT_LINKS } from "@/hooks/useSubscription";
import { toast } from "sonner";
import { trackEvent } from "@/lib/tracking";

const plans = [
  {
    id: "starter",
    name: "Sentinel",
    price: "490€",
    period: "TTC / an",
    monthly: "40,83€ / mois",
    tagline: "Première ligne de défense souveraine",
    badge: "DÉMARRAGE",
    badgeColor: "label-badge-cyan",
    highlight: false,
    icon: Shield,
    roiNote: "ROI dès la 1ère amende NIS2 évitée",
    features: [
      "Scout Agent — détection surface d'attaque",
      "Dashboard Direction + Technique",
      "Conformité RGPD & NIS2 documentée",
      "Evidence Vault — preuves SHA-256 immuables",
      "Rapports d'audit exportables PDF",
      "Inventaire des actifs cyber",
      "Hébergement souverain 🇫🇷",
      "Support email prioritaire",
    ],
  },
  {
    id: "pro",
    name: "Command",
    price: "6 900€",
    period: "TTC / an",
    monthly: "575€ / mois",
    tagline: "Centre de commandement cyber supervisé",
    badge: "★ CHOIX DSI / RSSI",
    badgeColor: "label-badge-purple",
    highlight: true,
    icon: Zap,
    roiNote: "= 5,75% du coût d'un RSSI interne (120k€)",
    features: [
      "Tout Sentinel inclus",
      "6 Agents IA Swarm Intelligence complets",
      "Self-healing supervisé · Objectif < 4h",
      "OSINT & EASM Signals — surveillance continue",
      "Evidence Vault SHA-256 Merkle Chain immuable",
      "Predictive Causality Engine · 90j d'horizon",
      "RSSI Virtuel IA — brief CODIR mensuel",
      "DSI Go/No-Go · validation en 1 clic",
      "SLA < 4h remédiation (cible contractuelle selon offre)",
    ],
  },
  {
    id: "enterprise",
    name: "Sovereign",
    price: "29 900€",
    period: "TTC / an",
    monthly: "2 491€ / mois",
    tagline: "Souveraineté totale · On-prem · Swarm supervisé",
    badge: "ENTERPRISE SOUVERAIN",
    badgeColor: "label-badge-cyan",
    highlight: false,
    icon: Crown,
    roiNote: "Inclut déploiement on-premise & Account Manager",
    features: [
      "Tout Command inclus",
      "Swarm Mode supervisé — agents assistés avec validation humaine",
      "Déploiement on-premise · SecNumCloud objectif roadmap",
      "Agents IA personnalisés sur vos process",
      "Preuves cryptographiques SHA-256 avancées",
      "Predictive Causality Engine Pro",
      "SLA renforcé · contractualisé selon offre Enterprise",
      "Account Manager CISO dédié",
      "Rapports Board-level personnalisés",
    ],
  },
];

// ROI Calculator widget
function RoiCalculator() {
  const [employees, setEmployees] = useState(100);
  const attackCost = Math.round(employees * 1200);
  const investment = 6900;
  const roi = Math.round((attackCost / investment) * 100) / 100;

  return (
    <div className="p-5 rounded-2xl glass-card border border-primary/20 space-y-4">
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-primary" />
        <p className="text-sm font-bold text-foreground">Calculateur ROI instantané</p>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-2 block">
          Taille de votre entreprise : <span className="text-foreground font-semibold">{employees} collaborateurs</span>
        </label>
        <input
          type="range"
          min="20"
          max="500"
          step="10"
          value={employees}
          onChange={(e) => setEmployees(Number(e.target.value))}
          className="w-full accent-primary h-1.5 rounded-full"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>20</span><span>500</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="p-3 rounded-lg bg-destructive/8 border border-destructive/20">
          <div className="text-sm font-bold font-mono text-destructive">{attackCost.toLocaleString('fr-FR')}€</div>
          <div className="text-[10px] text-muted-foreground">Coût cyber attaque estimé</div>
        </div>
        <div className="p-3 rounded-lg bg-primary/8 border border-primary/20">
          <div className="text-sm font-bold font-mono text-primary">6 900€</div>
          <div className="text-[10px] text-muted-foreground">Votre investissement Pro</div>
        </div>
        <div className="p-3 rounded-lg bg-success/8 border border-success/20">
          <div className="text-sm font-bold font-mono text-success">× {roi.toFixed(0)}</div>
          <div className="text-[10px] text-muted-foreground">ROI estimé an 1</div>
        </div>
      </div>
    </div>
  );
}

export function PricingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const { user } = useAuth();
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const tracked = useRef(false);

  // Track pricing section impression once
  useEffect(() => {
    if (isInView && !tracked.current) {
      tracked.current = true;
      trackEvent('pricing_section_viewed', { source_page: '/', cta_origin: 'pricing_section' });
    }
  }, [isInView]);

  async function handleStripeCheckout(planId: "starter" | "pro") {
    if (user) {
      setCheckoutLoading(planId);
      trackEvent('cta_stripe_checkout', { source_page: '/#pricing', cta_origin: `pricing_${planId}` });
      try {
        await openCheckout(planId);
      } catch {
        toast.error("Erreur checkout. Lien direct ouvert.");
        window.open(PAYMENT_LINKS[planId], "_blank", "noopener,noreferrer");
      } finally {
        setCheckoutLoading(null);
      }
    } else {
      trackEvent('cta_stripe_checkout', { source_page: '/#pricing', cta_origin: `pricing_${planId}_anon` });
      window.open(PAYMENT_LINKS[planId], "_blank", "noopener,noreferrer");
    }
  }

  return (
    <section ref={ref} className="relative py-28 overflow-hidden" id="pricing">
      <div className="absolute inset-0 gradient-radial opacity-35" />
      <div className="absolute inset-0 gradient-radial-purple opacity-25" />

      <TrialModal open={trialModalOpen} onClose={() => setTrialModalOpen(false)} />

      <div className="container relative px-4">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center space-y-4 mb-10"
          >
            <div className="label-badge label-badge-cyan mx-auto w-fit">
              <Sparkles className="w-3 h-3" />
              Tarification Transparente
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Un RSSI interne : <span className="text-destructive line-through opacity-70">120 000€/an</span>
              <br />
              SECURIT-E Pro : <span className="text-gradient">6 900€/an</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Tout inclus. Sans équipe cyber dédiée. Sans surprise. Essai 14 jours — carte requise, annulation libre.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-success/10 border border-success/30 text-success text-sm font-semibold">
              <Clock className="w-4 h-4" />
              14j gratuits · Carte requise · Paiement Stripe 🔒 · Satisfait ou remboursé 30j
            </div>
          </motion.div>

          {/* ROI Calculator */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mb-10"
          >
            <RoiCalculator />
          </motion.div>

          {/* Pricing grid */}
          <div className="grid md:grid-cols-3 gap-5 items-stretch">
            {plans.map((plan, index) => {
              const PlanIcon = plan.icon;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 40 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.12, ease: "easeOut" }}
                  className={`relative rounded-2xl p-6 flex flex-col ${
                    plan.highlight
                      ? "glass-card-premium border-glow"
                      : "glass-card border border-border hover:border-primary/20"
                  } transition-all duration-500`}
                >
                  {plan.highlight && (
                    <>
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold bg-primary text-primary-foreground neon-glow shadow-lg">
                        ★ Le choix des DSI exigeants
                      </div>
                      <div className="absolute inset-0 rounded-2xl pointer-events-none"
                        style={{ background: "radial-gradient(ellipse at top, hsl(258 90% 66% / 0.10) 0%, transparent 60%)" }} />
                    </>
                  )}

                  <div className="relative flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-5">
                      <div>
                        <div className={`label-badge ${plan.badgeColor} mb-2`}>{plan.badge}</div>
                        <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">{plan.tagline}</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <PlanIcon className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="mb-6 p-4 rounded-xl bg-secondary/50">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-4xl font-bold font-mono ${plan.highlight ? "text-gradient neon-text" : "text-foreground"}`}>
                          {plan.price}
                        </span>
                        <span className="text-muted-foreground text-sm">{plan.period}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">soit {plan.monthly}</p>
                      <p className="text-xs text-success font-medium mt-1.5">{plan.roiNote}</p>
                      {plan.id !== "enterprise" && (
                        <p className="text-xs text-success/80 font-medium mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> 14 jours gratuits inclus
                        </p>
                      )}
                    </div>

                    <div className="space-y-2.5 flex-1 mb-6">
                      {plan.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <div className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full bg-success/15 flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 text-success" />
                          </div>
                          <span className="text-sm text-foreground/80 leading-snug">{feature}</span>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-2 mt-auto">
                      {plan.id === "enterprise" ? (
                        <Button
                          size="lg"
                          className="w-full font-bold hover:scale-[1.02] transition-transform"
                          variant="outline"
                          onClick={() => setTrialModalOpen(true)}
                        >
                          <CalendarDays className="w-4 h-4 mr-1.5" />
                          Parler à l'équipe
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      ) : user ? (
                        <Button
                          size="lg"
                          className={`w-full font-bold ${plan.highlight ? "neon-glow btn-magnetic hover:scale-[1.02] transition-transform" : "hover:scale-[1.02] transition-transform"}`}
                          variant={plan.highlight ? "default" : "outline"}
                          disabled={checkoutLoading === plan.id}
                          onClick={() => handleStripeCheckout(plan.id as "starter" | "pro")}
                        >
                          {checkoutLoading === plan.id
                             ? <Zap className="w-4 h-4 mr-1.5 animate-pulse" />
                             : <CreditCard className="w-4 h-4 mr-1.5" />}
                           {plan.id === "starter" ? `Activer Sentinel — ${plan.price}` : `Activer Command — ${plan.price}`}
                           <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      ) : (
                        <Button
                          size="lg"
                          className={`w-full font-bold ${plan.highlight ? "neon-glow btn-magnetic hover:scale-[1.02] transition-transform" : "hover:scale-[1.02] transition-transform"}`}
                          disabled={checkoutLoading === plan.id}
                          onClick={() => handleStripeCheckout(plan.id as "starter" | "pro")}
                        >
                          {checkoutLoading === plan.id
                            ? <Zap className="w-4 h-4 mr-1.5 animate-pulse" />
                            : <CreditCard className="w-4 h-4 mr-1.5" />}
                          Essai gratuit 14j — {plan.price} / an
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}
                      {plan.id !== "enterprise" && (
                        <p className="text-[10px] text-center text-muted-foreground">
                          🔒 Stripe · Satisfait ou remboursé 30j · Annulation libre
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Competitor comparison */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-10 overflow-x-auto"
          >
            <div className="min-w-[580px] rounded-xl border border-border glass-card p-5">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-4">Vs. alternatives du marché</p>
              <div className="grid grid-cols-4 gap-3 text-sm">
                {[
                   { name: "SECURIT-E Command", price: "6 900€ / an", highlight: true, note: "✓ 14j gratuits · Essai immédiat", sub: "6 agents IA + Evidence Vault" },
                   { name: "RSSI interne", price: "~120 000€ / an", highlight: false, note: "Salaire + charges + formation", sub: "1 personne, pas 24/7" },
                   { name: "Palantir / Tanium", price: "≥ 50 000€ / an", highlight: false, note: "Tarifs enterprise uniquement", sub: "Complexité d'intégration élevée" },
                   { name: "Consulting cyber", price: "≥ 15 000€ / mission", highlight: false, note: "Ponctuel, non continu", sub: "Pas de preuve automatique" },
                 ].map((c) => (
                  <div key={c.name} className={`rounded-xl p-4 border ${c.highlight ? "border-primary/50 bg-primary/8" : "border-border bg-muted/20"}`}>
                    <p className={`font-bold text-xs mb-1.5 ${c.highlight ? "text-primary" : "text-foreground"}`}>{c.name}</p>
                    <p className="font-mono font-black text-sm text-foreground">{c.price}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{c.sub}</p>
                    <p className={`text-[10px] mt-1.5 font-semibold ${c.highlight ? "text-success" : "text-muted-foreground/60"}`}>{c.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
