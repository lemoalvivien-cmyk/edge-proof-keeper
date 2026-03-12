import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Shield, Check, ArrowRight, ArrowLeft, Zap, Lock, BarChart3, FileText, Users, RefreshCw, Globe, Rocket, Package, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LandingNav } from "@/components/landing/LandingNav";
import { FooterSection } from "@/components/landing/FooterSection";
import { DemoRequestDialog } from "@/components/ui/DemoRequestDialog";
import { useAuth } from "@/contexts/AuthContext";
import { usePublicCta } from "@/hooks/usePublicCta";

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
    title: "Evidence Vault",
    description: "Journal immuable et certifié de toutes vos actions pour les audits.",
  },
];

const included = [
  "Diagnostic cyber complet",
  "Double tableau de bord (Direction + Technique)",
  "Suivi conformité RGPD & NIS2",
  "Evidence Vault (coffre-fort de preuves immuable)",
  "Rapports d'audit exportables PDF",
  "Inventaire des actifs",
  "Gestion des autorisations légales",
  "Import de documents (politiques, audits...)",
  "Mises à jour continues de la plateforme",
  "Support par email prioritaire",
  "Hébergement sécurisé en France 🇫🇷",
  "Chiffrement de bout en bout",
];

const addons = [
  {
    id: "cabinet-mode",
    name: "Mode Cabinet / Multi-clients",
    price: "+250€",
    period: "TTC / an",
    icon: Users,
    description: "Gérez plusieurs organisations clients",
    status: "coming_v2" as const,
    href: "/offres/audit-pack-cabinets",
  },
  {
    id: "continuous-governance",
    name: "Continuous Governance",
    price: "+150€",
    period: "TTC / an",
    icon: RefreshCw,
    description: "Imports récurrents, suivi temporel",
    status: "available" as const,
    href: "/offres/continuous-governance",
  },
  {
    id: "easm-signals",
    name: "EASM & OSINT Signals",
    price: "+200€",
    period: "TTC / an",
    icon: Globe,
    description: "Surface d'attaque externe",
    status: "available" as const,
    href: "/offres/easm-osint-signals",
  },
  {
    id: "onboarding",
    name: "Onboarding / Audit Readiness",
    price: "+300€",
    period: "one-time",
    icon: Rocket,
    description: "Accompagnement initial",
    status: "available" as const,
    href: null,
  },
];

const Pricing = () => {
  const { user } = useAuth();
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);
  const cta = usePublicCta();

  const hasCheckout = Boolean(cta.checkoutUrls.starter);
  const hasBooking  = Boolean(cta.bookingUrl);

  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      
      <main className="pt-32 pb-16">
        <div className="container px-4">
          {/* Back link */}
          <Button
            variant="ghost"
            className="mb-8 text-muted-foreground hover:text-foreground"
            asChild
          >
            <Link to="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Link>
          </Button>

          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center space-y-4 mb-16"
            >
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
            </motion.div>

            {/* Main pricing card */}
            <div className="grid lg:grid-cols-2 gap-12 mb-16">
              {/* Left: Features */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="space-y-6"
              >
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
              </motion.div>

              {/* Right: Pricing card */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <Card className="glass-card border-glow sticky top-32">
                  <CardHeader className="text-center pb-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 neon-glow">
                      <Shield className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground">SENTINEL EDGE Core</h3>
                    <p className="text-muted-foreground">Gouvernance cyber complète</p>
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

                    {/* CTAs — fully DB-aware via usePublicCta */}
                    <div className="space-y-3">
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
                          disabled={cta.isLoading}
                          onClick={() =>
                            cta.handleCheckout('starter', {
                              sourcePage: '/pricing',
                              ctaOrigin: 'pricing_page_starter',
                              onFallback: () => setDemoDialogOpen(true),
                            })
                          }
                        >
                          {hasCheckout ? (
                            <>Commander — 490€ TTC / an <ArrowRight className="w-5 h-5 ml-2" /></>
                          ) : hasBooking ? (
                            <>Prendre rendez-vous <ArrowRight className="w-5 h-5 ml-2" /></>
                          ) : (
                            <>Demander l'accès <ArrowRight className="w-5 h-5 ml-2" /></>
                          )}
                        </Button>
                      )}

                      {!user && (
                        <Button
                          variant="outline"
                          size="lg"
                          className="w-full h-12 text-base gap-2"
                          disabled={cta.isLoading}
                          onClick={() =>
                            cta.handleDemoRequest({
                              sourcePage: '/pricing',
                              ctaOrigin: 'pricing_page_demo',
                              onFallback: () => setDemoDialogOpen(true),
                            })
                          }
                        >
                          <CalendarDays className="w-4 h-4" />
                          Parler à un expert
                        </Button>
                      )}
                      
                      {/* Runtime source indicator — visible, honest, testable */}
                      {!cta.isLoading && (
                        <div className="p-3 rounded-xl bg-muted/20 border border-border text-center space-y-1">
                          {hasCheckout && (
                            <p className="text-xs text-success">✓ Paiement direct activé (Stripe)</p>
                          )}
                          {!hasCheckout && hasBooking && (
                            <p className="text-xs text-primary">📅 Prise de rendez-vous activée</p>
                          )}
                          {!hasCheckout && !hasBooking && (
                            <p className="text-xs text-muted-foreground">
                              Formulaire de demande (aucun lien commercial configuré)
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground/60">
                            Config : {cta.configSource}
                            {cta.tenantResolved ? ' · tenant résolu' : ' · fallback env'}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Trust badges */}
                    <div className="flex flex-wrap justify-center gap-4 pt-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        RGPD conforme
                      </span>
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        Données en France 🇫🇷
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Everything included */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="glass-card rounded-2xl p-8 mb-16"
            >
              <h2 className="text-2xl font-bold text-foreground mb-8 text-center">
                Tout est <span className="text-gradient">inclus</span> dans Core
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
            </motion.div>

            {/* Add-ons section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-16"
            >
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 mb-4">
                  <Package className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary font-medium">Add-ons optionnels</span>
                </div>
                <h2 className="text-2xl font-bold text-foreground">Étendez votre gouvernance</h2>
                <p className="text-muted-foreground mt-2">En complément du plan Core</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {addons.map((addon, index) => (
                  <motion.div
                    key={addon.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
                  >
                    <Card className="glass-card h-full hover:border-primary/50 transition-colors">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <addon.icon className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-foreground">{addon.name}</h3>
                              <p className="text-sm text-muted-foreground">{addon.description}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                          <div>
                            <span className="text-xl font-bold text-primary">{addon.price}</span>
                            <span className="text-xs text-muted-foreground ml-1">{addon.period}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {addon.status === "coming_v2" ? (
                              <Badge variant="outline" className="text-xs">V2</Badge>
                            ) : (
                              <Badge className="bg-success/20 text-success border-0 text-xs">Disponible</Badge>
                            )}
                            {addon.href && (
                              <Button variant="ghost" size="sm" asChild>
                                <Link to={addon.href}>
                                  Détails
                                  <ArrowRight className="w-3 h-3 ml-1" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <FooterSection />

      <DemoRequestDialog
        open={demoDialogOpen}
        onOpenChange={setDemoDialogOpen}
        ctaOrigin="pricing_page_cta"
        sourcePage="/pricing"
      />
    </div>
  );
};

export default Pricing;
