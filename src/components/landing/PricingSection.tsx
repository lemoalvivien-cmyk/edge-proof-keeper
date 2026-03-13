import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ArrowRight, Sparkles, CalendarDays, Zap, Crown, Shield, Cpu, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { DemoRequestDialog } from "@/components/ui/DemoRequestDialog";
import { usePublicCta } from "@/hooks/usePublicCta";

const plans = [
  {
    id: "starter",
    name: "Starter",
    price: "490€",
    period: "TTC / an",
    monthly: "40,83€ / mois",
    tagline: "Détection & gouvernance de base",
    badge: "DÉMARRAGE",
    badgeColor: "label-badge-cyan",
    highlight: false,
    icon: Shield,
    features: [
      "Scout Agent — détection continue",
      "Dashboard Direction + Technique",
      "Conformité RGPD & NIS2",
      "Evidence Vault basique",
      "Rapports d'audit exportables",
      "Inventaire des actifs",
      "Hébergement souverain 🇫🇷",
      "Support email prioritaire",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "6 900€",
    period: "TTC / an",
    monthly: "575€ / mois",
    tagline: "Agents IA complets + self-healing 4h",
    badge: "CASH ENGINE",
    badgeColor: "label-badge-purple",
    highlight: true,
    icon: Zap,
    features: [
      "Tout Starter inclus",
      "6 Agents IA Swarm complets",
      "Self-healing autonome < 4h",
      "OSINT & EASM Signals continus",
      "Evidence Vault post-quantique",
      "Predictive Causality Engine",
      "RSSI Virtuel IA (brief mensuel)",
      "DSI Go/No-Go dashboard",
      "SLA 99.9% garanti",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "29 900€",
    period: "TTC / an",
    monthly: "2 491€ / mois",
    tagline: "Swarm Mode + fully autonomous + on-prem",
    badge: "SOUVERAINETÉ TOTALE",
    badgeColor: "label-badge-cyan",
    highlight: false,
    icon: Crown,
    features: [
      "Tout Pro inclus",
      "Swarm Mode fully autonomous",
      "Déploiement on-premise possible",
      "Agents IA personnalisés",
      "zk-SNARK + lattice crypto avancé",
      "Predictive Causality Engine Pro",
      "SLA 99.99% garanti",
      "Account Manager dédié",
      "CISO Board-level reports",
    ],
  },
];

export function PricingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });
  const { user } = useAuth();
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);
  const cta = usePublicCta();

  return (
    <section ref={ref} className="relative py-28 overflow-hidden" id="pricing">
      <div className="absolute inset-0 gradient-radial opacity-40" />
      <div className="absolute inset-0 gradient-radial-purple opacity-30" />

      <div className="container relative px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center space-y-4 mb-14"
          >
            <div className="label-badge label-badge-cyan mx-auto w-fit">
              <Sparkles className="w-3 h-3" />
              Tarification
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Un prix <span className="text-gradient">transparent</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              De la détection seule à la souveraineté autonome totale.
              Chaque euro justifié par des agents qui travaillent en permanence.
            </p>
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
                  {/* Popular glow */}
                  {plan.highlight && (
                    <div className="absolute inset-0 rounded-2xl pointer-events-none"
                      style={{ background: "radial-gradient(ellipse at top, hsl(258 90% 66% / 0.10) 0%, transparent 60%)" }} />
                  )}

                  <div className="relative flex-1 flex flex-col">
                    {/* Header */}
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

                    {/* Price */}
                    <div className="mb-6 p-4 rounded-xl bg-secondary/50">
                      <div className="flex items-baseline gap-2">
                        <span className={`text-4xl font-bold font-mono ${plan.highlight ? "text-gradient neon-text" : "text-foreground"}`}>
                          {plan.price}
                        </span>
                        <span className="text-muted-foreground text-sm">{plan.period}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">soit {plan.monthly}</p>
                    </div>

                    {/* Features */}
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

                    {/* CTA */}
                    <div className="space-y-2 mt-auto">
                      {user ? (
                        <Button
                          size="lg"
                          className={`w-full font-bold ${plan.highlight ? "neon-glow btn-magnetic" : ""}`}
                          variant={plan.highlight ? "default" : "outline"}
                          asChild
                        >
                          <Link to="/dashboard">
                            Accéder au cockpit
                            <ArrowRight className="w-4 h-4 ml-1" />
                          </Link>
                        </Button>
                      ) : plan.id === "starter" ? (
                        <Button
                          size="lg"
                          className="w-full font-bold hover:scale-[1.02] transition-transform"
                          variant="outline"
                          disabled={cta.isLoading}
                          onClick={() => cta.handleCheckout('starter', {
                            sourcePage: '/#pricing',
                            ctaOrigin: `pricing_${plan.id}`,
                            onFallback: () => setDemoDialogOpen(true),
                          })}
                        >
                          Commencer gratuit — {plan.price} / an
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      ) : (
                        <Button
                          size="lg"
                          className={`w-full font-bold ${plan.highlight ? "neon-glow btn-magnetic hover:scale-[1.02] transition-transform" : "hover:scale-[1.02] transition-transform"}`}
                          disabled={cta.isLoading}
                          onClick={() => cta.handleDemoRequest({
                            sourcePage: '/#pricing',
                            ctaOrigin: `pricing_${plan.id}`,
                            onFallback: () => setDemoDialogOpen(true),
                          })}
                        >
                          <CalendarDays className="w-4 h-4 mr-1.5" />
                          {plan.id === "pro" ? "Activer les 6 Agents" : "Contacter les ventes"}
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Justification */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
            className="mt-10 p-5 rounded-2xl glass-card border border-primary/15 text-center"
          >
            <div className="flex items-center justify-center gap-1.5 mb-2">
              {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-warning text-warning" />)}
            </div>
            <p className="text-sm text-muted-foreground max-w-3xl mx-auto">
              <span className="text-foreground font-semibold">Pourquoi Pro à 6 900€ est sous-évalué ?</span>{" "}
              6 agents IA autonomes 24/7 + self-healing 4h + Evidence Vault post-quantique = valeur Palantir Enterprise à prix PME.
              Une seule cyberattaque coûte en moyenne{" "}
              <span className="text-destructive font-semibold">180 000€</span> à une PME.
              SENTINEL IMMUNE Pro à 6 900€/an, c'est votre machine de guerre souveraine.
            </p>
          </motion.div>
        </div>
      </div>

      <DemoRequestDialog
        open={demoDialogOpen}
        onOpenChange={setDemoDialogOpen}
        ctaOrigin="pricing_section_cta"
        sourcePage="/#pricing"
      />
    </section>
  );
}
