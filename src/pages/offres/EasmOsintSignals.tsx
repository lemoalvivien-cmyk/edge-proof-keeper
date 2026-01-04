import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Shield, Globe, Eye, Lock, ArrowRight, CheckCircle2, AlertTriangle, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LandingNav } from "@/components/landing/LandingNav";
import { FooterSection } from "@/components/landing/FooterSection";

const targetAudience = [
  { icon: Globe, label: "RSSI / Équipes Sécurité", description: "Cartographier votre surface d'attaque externe" },
  { icon: Search, label: "Analystes SOC", description: "Intégrer les signaux OSINT dans votre gouvernance" },
];

const problemsSolved = [
  "Surface d'attaque externe inconnue ou mal cartographiée",
  "Signaux OSINT dispersés sans traçabilité",
  "Pas de preuve des analyses de surface externe",
  "Impossible de démontrer une veille active",
];

const included = [
  "Import résultats EASM (Amass, Subfinder, etc.)",
  "Import signaux OSINT (theHarvester, SpiderFoot exports)",
  "Normalisation et déduplication des assets",
  "Evidence Vault pour tracer les découvertes",
  "Proof Packs incluant la cartographie externe",
  "Tableaux de bord surface d'attaque",
];

const safeApproach = [
  "100% passif — aucune interaction avec les cibles",
  "Import uniquement de VOS propres résultats",
  "Autorisation préalable obligatoire",
  "Aucun scan actif depuis Sentinel Edge",
];

const limitations = [
  "V1 = Import-first uniquement, pas d'exécution EASM",
  "Formats supportés : JSON, CSV",
  "Vous exécutez les outils, nous traçons les résultats",
];

export default function EasmOsintSignals() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      
      <main className="pt-32 pb-20">
        <div className="container px-4 max-w-5xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            <Badge variant="outline" className="mb-4 border-primary/50 text-primary">
              <Globe className="w-3 h-3 mr-1" />
              Offre EASM / OSINT
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">EASM & OSINT Signals</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tracez votre surface d'attaque externe. Intégrez les signaux OSINT avec preuves opposables.
            </p>
            <Badge className="mt-4 bg-success/20 text-success border-0">
              <Eye className="w-3 h-3 mr-1" />
              100% SAFE — Passif uniquement
            </Badge>
          </motion.div>

          {/* Pour qui */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Pour qui ?
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {targetAudience.map((item, i) => (
                <Card key={i} className="glass-card">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <item.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{item.label}</h3>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.section>

          {/* Approche SAFE */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Eye className="w-6 h-6 text-success" />
              Approche 100% SAFE
            </h2>
            <Card className="glass-card border-success/30 bg-success/5">
              <CardContent className="p-6">
                <ul className="space-y-3">
                  {safeApproach.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.section>

          {/* Problèmes résolus */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-warning" />
              Problèmes résolus
            </h2>
            <Card className="glass-card border-warning/30">
              <CardContent className="p-6">
                <ul className="space-y-3">
                  {problemsSolved.map((problem, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-warning mt-2" />
                      <span className="text-foreground">{problem}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.section>

          {/* Ce qui est inclus */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-success" />
              Ce qui est inclus
            </h2>
            <Card className="glass-card border-success/30">
              <CardContent className="p-6">
                <ul className="space-y-3">
                  {included.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.section>

          {/* Preuves */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary" />
              Preuves auditor-grade
            </h2>
            <Card className="glass-card border-primary/30 bg-primary/5">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
                    <h3 className="font-semibold text-foreground">Evidence Vault</h3>
                    <p className="text-sm text-muted-foreground">Traçabilité EASM/OSINT</p>
                  </div>
                  <div className="text-center">
                    <Globe className="w-8 h-8 text-primary mx-auto mb-2" />
                    <h3 className="font-semibold text-foreground">Hash Chain</h3>
                    <p className="text-sm text-muted-foreground">Preuves de découvertes</p>
                  </div>
                  <div className="text-center">
                    <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                    <h3 className="font-semibold text-foreground">Proof Packs</h3>
                    <p className="text-sm text-muted-foreground">Exports surface externe</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.section>

          {/* Limitations */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-16"
          >
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-muted-foreground" />
              Limitations V1 (transparence)
            </h2>
            <Card className="glass-card border-muted/30">
              <CardContent className="p-6">
                <ul className="space-y-3">
                  {limitations.map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground mt-2" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.section>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            <Card className="glass-card border-glow max-w-lg mx-auto">
              <CardContent className="p-8">
                <Badge className="mb-4 bg-primary/20 text-primary border-0">Add-on</Badge>
                <p className="text-3xl font-bold text-primary mb-2">+200€ TTC/an</p>
                <p className="text-muted-foreground mb-6">En complément du plan Core (490€)</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="neon-glow">
                    <Link to="/auth">
                      Demander activation
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link to="/pricing">Voir tous les plans</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>

      <FooterSection />
    </div>
  );
}
