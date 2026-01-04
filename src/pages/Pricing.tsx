import { useNavigate } from "react-router-dom";
import { Shield, Check, ArrowRight, ArrowLeft, Zap, Lock, BarChart3, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { LandingNav } from "@/components/landing/LandingNav";
import { FooterSection } from "@/components/landing/FooterSection";

const features = [
  {
    icon: Zap,
    title: "Diagnostic cyber complet",
    description: "Analyse automatisée de vos vulnérabilités et de votre posture de sécurité.",
  },
  {
    icon: BarChart3,
    title: "Double tableau de bord",
    description: "Vue Direction (synthèse métier) + Vue Technique (détails pour votre IT).",
  },
  {
    icon: FileText,
    title: "Conformité RGPD & NIS2",
    description: "Suivi en temps réel de votre progression sur chaque exigence réglementaire.",
  },
  {
    icon: Lock,
    title: "Coffre-fort de preuves",
    description: "Journal immuable et certifié de toutes vos actions pour les audits.",
  },
];

const included = [
  "Diagnostic cyber complet",
  "Double tableau de bord (Direction + Technique)",
  "Suivi conformité RGPD & NIS2",
  "Coffre-fort de preuves immuable",
  "Rapports d'audit exportables PDF",
  "Inventaire des actifs",
  "Gestion des autorisations légales",
  "Import de documents (politiques, audits...)",
  "Mises à jour continues de la plateforme",
  "Support par email prioritaire",
  "Hébergement sécurisé en France",
  "Chiffrement de bout en bout",
];

const Pricing = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      
      <main className="pt-24 pb-16">
        <div className="container px-4">
          {/* Back link */}
          <Button
            variant="ghost"
            className="mb-8 text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour à l'accueil
          </Button>

          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="text-center space-y-4 mb-16">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-glow mb-4">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm text-muted-foreground">Offre V1 — Lancement</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold">
                <span className="text-gradient">490€ TTC / an</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Tout ce dont vous avez besoin pour piloter votre cybersécurité 
                et prouver votre conformité. Sans surprise.
              </p>
            </div>

            {/* Main pricing card */}
            <div className="grid lg:grid-cols-2 gap-12 mb-16">
              {/* Left: Features */}
              <div className="space-y-6">
                <h2 className="text-2xl font-bold text-foreground">Fonctionnalités clés</h2>
                <div className="grid gap-4">
                  {features.map((feature, index) => (
                    <Card key={index} className="glass-card">
                      <CardContent className="p-4 flex gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <feature.icon className="w-5 h-5 text-primary" />
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{feature.title}</h3>
                          <p className="text-sm text-muted-foreground">{feature.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Right: Pricing card */}
              <div>
                <Card className="glass-card border-glow sticky top-24">
                  <CardHeader className="text-center pb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 neon-glow">
                      <Shield className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">SENTINEL EDGE</h3>
                    <p className="text-muted-foreground">Offre complète V1</p>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
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

                    {/* CTA */}
                    <div className="space-y-4">
                      <Button 
                        size="lg" 
                        className="w-full h-14 text-lg font-semibold neon-glow hover:scale-105 transition-transform"
                        onClick={() => navigate("/auth")}
                      >
                        Demander activation
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                      
                      <div className="p-4 rounded-xl bg-warning/10 border border-warning/30 text-center">
                        <p className="text-sm text-warning font-medium">
                          🚀 Paiement bientôt disponible
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Créez votre compte maintenant pour être notifié
                        </p>
                      </div>
                    </div>

                    {/* Trust badges */}
                    <div className="flex flex-wrap justify-center gap-4 pt-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        RGPD conforme
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        Données en France
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Everything included */}
            <div className="glass-card rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
                Tout est <span className="text-gradient">inclus</span>
              </h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {included.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-success/20 flex items-center justify-center">
                      <Check className="w-3 h-3 text-success" />
                    </div>
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <FooterSection />
    </div>
  );
};

export default Pricing;
