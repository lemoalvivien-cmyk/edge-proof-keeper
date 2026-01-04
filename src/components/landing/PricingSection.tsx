import { useNavigate } from "react-router-dom";
import { Check, Shield, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const features = [
  "Diagnostic cyber complet",
  "Double tableau de bord (Direction + Technique)",
  "Suivi conformité RGPD & NIS2",
  "Coffre-fort de preuves immuable",
  "Rapports d'audit exportables",
  "Mises à jour continues",
  "Support par email prioritaire",
  "Hébergement sécurisé en France",
];

export function PricingSection() {
  const navigate = useNavigate();

  return (
    <section className="relative py-24 overflow-hidden" id="pricing">
      {/* Background */}
      <div className="absolute inset-0 gradient-radial opacity-50" />

      <div className="container relative px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section header */}
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold">
              Un prix <span className="text-gradient">transparent</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Une seule offre, tout inclus. Pas de surprises, pas de frais cachés.
            </p>
          </div>

          {/* Pricing card */}
          <Card className="glass-card border-glow max-w-lg mx-auto">
            <CardHeader className="text-center pb-0 pt-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 neon-glow">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-foreground">SENTINEL EDGE</h3>
              <p className="text-muted-foreground">Offre complète V1</p>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* Price */}
              <div className="text-center">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-bold text-primary neon-text">490€</span>
                  <span className="text-muted-foreground">TTC / an</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Soit moins de 41€ / mois
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
                <Button 
                  size="lg" 
                  className="w-full h-14 text-lg font-semibold neon-glow hover:scale-105 transition-transform"
                  onClick={() => navigate("/pricing")}
                >
                  Demander activation
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  Paiement bientôt disponible • Essai gratuit avec le rapport choc
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
