import { motion } from "framer-motion";
import { Shield, Package, Users, RefreshCw, Globe, Rocket, Lock, Check, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";

const corePlan = {
  name: "SECURIT-E Core",
  price: "490€",
  period: "TTC / an",
  description: "Gouvernance cyber complète import-first",
  features: [
    "Imports Hub (tous outils)",
    "Evidence Vault + Hash Chain",
    "Proof Packs exportables",
    "Tableaux de bord Direction + Technique",
    "Suivi conformité RGPD & NIS2",
    "Inventaire des actifs",
    "Remédiation & suivi tâches",
    "Hébergement sécurisé France 🇫🇷",
  ],
};

const addons = [
  {
    id: "cabinet-mode",
    name: "Mode Cabinet / Multi-clients",
    price: "+250€",
    period: "TTC / an",
    icon: Users,
    description: "Gérez plusieurs organisations clients depuis un seul compte cabinet.",
    status: "coming_v2" as const,
  },
  {
    id: "continuous-governance",
    name: "Continuous Governance",
    price: "+150€",
    period: "TTC / an",
    icon: RefreshCw,
    description: "Imports récurrents, suivi temporel, alertes dégradation posture.",
    status: "available" as const,
  },
  {
    id: "easm-signals",
    name: "EASM & OSINT Signals",
    price: "+200€",
    period: "TTC / an",
    icon: Globe,
    description: "Cartographiez votre surface d'attaque externe avec traçabilité.",
    status: "available" as const,
  },
  {
    id: "onboarding",
    name: "Onboarding / Audit Readiness",
    price: "+300€",
    period: "one-time",
    icon: Rocket,
    description: "Accompagnement initial pour démarrer rapidement et efficacement.",
    status: "available" as const,
  },
];

export default function PlansAddons() {
  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary/10">
            <Package className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Plans & Add-ons</h1>
            <p className="text-muted-foreground">Vue lecture seule — Gestion des plans prévue V2</p>
          </div>
        </div>

        {/* Info Banner */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-4 flex items-center gap-3">
            <Lock className="w-5 h-5 text-primary flex-shrink-0" />
            <p className="text-sm text-foreground">
              <strong>Paiement via lien Stripe externe (V1).</strong> Paiement intégré prévu V2 (feature flag).
            </p>
          </CardContent>
        </Card>

        {/* Core Plan */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-glow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Shield className="w-8 h-8 text-primary" />
                  <div>
                    <CardTitle className="text-xl">{corePlan.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{corePlan.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">{corePlan.price}</p>
                  <p className="text-sm text-muted-foreground">{corePlan.period}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-3">
                {corePlan.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-success" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Add-ons */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Add-ons disponibles
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {addons.map((addon, i) => (
              <motion.div
                key={addon.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <addon.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{addon.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-lg font-bold text-primary">{addon.price}</span>
                            <span className="text-xs text-muted-foreground">{addon.period}</span>
                          </div>
                        </div>
                      </div>
                      {addon.status === "coming_v2" ? (
                        <Badge variant="outline" className="text-xs">V2</Badge>
                      ) : (
                        <Badge className="bg-success/20 text-success border-0 text-xs">Disponible</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{addon.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Contact CTA */}
        <Card className="bg-secondary/50">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold text-foreground mb-2">Besoin d'un plan personnalisé ?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Contactez-nous pour discuter de vos besoins spécifiques.
            </p>
            <Button variant="outline" asChild>
              <a href="mailto:contact@securit-e.com">
                Nous contacter
                <ArrowRight className="w-4 h-4 ml-2" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
