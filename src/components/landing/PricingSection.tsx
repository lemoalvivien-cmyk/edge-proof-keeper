import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Shield, ArrowRight, Sparkles, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { DemoRequestDialog } from "@/components/ui/DemoRequestDialog";

const features = [
  "Diagnostic cyber complet",
  "Double tableau de bord (Direction + Technique)",
  "Suivi conformité RGPD & NIS2",
  "Evidence Vault (coffre-fort de preuves immuable)",
  "Rapports d'audit exportables",
  "Inventaire des actifs",
  "Mises à jour continues",
  "Support par email prioritaire",
  "Hébergement sécurisé en France 🇫🇷",
];

export function PricingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const { user } = useAuth();

  return (
    <section ref={ref} className="relative py-24 overflow-hidden" id="pricing">
      {/* Background */}
      <div className="absolute inset-0 gradient-radial opacity-50" />

      <div className="container relative px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center space-y-4 mb-12"
          >
            <span className="inline-block px-3 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full">
              Tarification
            </span>
            <h2 className="text-3xl md:text-4xl font-bold">
              Un prix <span className="text-gradient">transparent</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Une seule offre V1, tout inclus. Pas de surprises, pas de frais cachés.
            </p>
          </motion.div>

          {/* Pricing card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="glass-card border-glow max-w-lg mx-auto">
              <CardHeader className="text-center pb-0 pt-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 mx-auto mb-4">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary font-medium">Offre V1 — Lancement</span>
                </div>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 neon-glow">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">SENTINEL EDGE</h3>
                <p className="text-muted-foreground">Gouvernance cyber complète</p>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                {/* Price */}
                <div className="text-center p-6 rounded-xl bg-secondary/50">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-5xl font-bold text-primary neon-text">490€</span>
                    <span className="text-muted-foreground">TTC / an</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Soit seulement <span className="text-foreground font-semibold">40,83€ / mois</span>
                  </p>
                </div>

                {/* Features */}
                <div className="space-y-3">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex-shrink-0 w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-success" />
                      </div>
                      <span className="text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="space-y-4">
                  {user ? (
                    <Button 
                      size="lg" 
                      className="w-full h-14 text-lg font-semibold neon-glow hover:scale-105 transition-transform"
                      asChild
                    >
                      <Link to="/dashboard">
                        Accéder au cockpit
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Link>
                    </Button>
                  ) : (
                    <Button 
                      size="lg" 
                      className="w-full h-14 text-lg font-semibold neon-glow hover:scale-105 transition-transform"
                      asChild
                    >
                      <Link to="/auth">
                        Se connecter
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Link>
                    </Button>
                  )}
                  
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/30 text-center">
                    <p className="text-sm text-foreground font-medium">
                      💳 Paiement via lien Stripe externe (V1)
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Paiement intégré prévu V2 (feature flag)
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
