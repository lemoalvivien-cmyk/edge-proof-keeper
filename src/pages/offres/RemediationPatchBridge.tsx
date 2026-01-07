import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Shield, Wrench, ClipboardCheck, Lock, ArrowRight, CheckCircle2, AlertTriangle, Users, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LandingNav } from "@/components/landing/LandingNav";
import { FooterSection } from "@/components/landing/FooterSection";

const targetAudience = [
  { icon: Wrench, label: "Équipes IT / Ops", description: "Suivre et prouver la remédiation des vulnérabilités" },
  { icon: Target, label: "RSSI / DSI", description: "Visibilité sur l'avancement des correctifs" },
];

const problemsSolved = [
  "Vulnérabilités identifiées mais jamais corrigées",
  "Aucune preuve que les correctifs ont été appliqués",
  "Pas de suivi structuré des tâches de remédiation",
  "Impossible de démontrer la diligence en cas d'incident",
];

const included = [
  "Création de tâches de remédiation depuis les findings",
  "Statuts : à faire, en cours, terminé, bloqué",
  "Historique complet des actions de remédiation",
  "Proof Packs incluant les preuves de correction",
  "Tableaux de bord de suivi remédiation",
  "Evidence Vault avec traçabilité des corrections",
];

const limitations = [
  "V1 = Suivi manuel des tâches (pas d'automation)",
  "Pas d'intégration Jira/ServiceNow en V1",
  "Les preuves de correction doivent être importées manuellement",
];

export default function RemediationPatchBridge() {
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
              <Wrench className="w-3 h-3 mr-1" />
              Offre Remédiation
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-gradient">Remediation Patch Bridge</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Suivez et prouvez la correction de vos vulnérabilités. De la détection à la remédiation, avec preuves.
            </p>
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
                    <p className="text-sm text-muted-foreground">Historique de remédiation immuable</p>
                  </div>
                  <div className="text-center">
                    <ClipboardCheck className="w-8 h-8 text-primary mx-auto mb-2" />
                    <h3 className="font-semibold text-foreground">Hash Chain</h3>
                    <p className="text-sm text-muted-foreground">Preuve de correction horodatée</p>
                  </div>
                  <div className="text-center">
                    <Shield className="w-8 h-8 text-primary mx-auto mb-2" />
                    <h3 className="font-semibold text-foreground">Proof Packs</h3>
                    <p className="text-sm text-muted-foreground">Exports pour conformité</p>
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
                <p className="text-3xl font-bold text-primary mb-2">490€ TTC/an</p>
                <p className="text-muted-foreground mb-6">Accès complet au Remediation Pack</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg" className="neon-glow">
                    <Link to="/auth">
                      Se connecter
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
