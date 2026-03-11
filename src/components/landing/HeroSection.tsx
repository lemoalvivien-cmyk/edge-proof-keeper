import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, ArrowRight, Sparkles, FlaskConical, Upload, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoRequestDialog } from "@/components/ui/DemoRequestDialog";
import { trackEvent } from "@/lib/tracking";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: { staggerChildren: 0.1 },
  },
};

export function HeroSection() {
  const navigate = useNavigate();
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24">
      {/* Background effects */}
      <div className="absolute inset-0 gradient-radial" />
      <div className="absolute inset-0 grid-pattern opacity-10" />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl"
        style={{ animation: "float 6s ease-in-out infinite" }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
        style={{ animation: "float 6s ease-in-out infinite", animationDelay: "-3s" }}
      />

      <div className="container relative z-10 px-4 py-20">
        <motion.div
          initial="initial"
          animate="animate"
          variants={stagger}
          className="max-w-4xl mx-auto text-center space-y-8"
        >
          {/* Badge */}
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-glow"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              Plateforme de gouvernance cyber — RGPD &amp; NIS2
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight"
          >
            <span className="text-foreground">Prouver votre </span>
            <span className="text-gradient neon-text">cybersécurité</span>
            <br />
            <span className="text-foreground">à votre Direction</span>
          </motion.h1>

          {/* Value prop — 10 seconds comprehension */}
          <motion.p
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Importez vos rapports de sécurité. Obtenez en quelques clics un rapport 
            DG/PDG lisible, un plan de remédiation et vos preuves de conformité.{" "}
            <span className="text-foreground font-medium">Zéro jargon. 100% auditables.</span>
          </motion.p>

          {/* 3 CTAs maximum */}
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
          >
            {/* CTA 1 — Voir démo (primary) */}
            <Button
              size="lg"
              className="h-13 px-8 text-base font-semibold neon-glow hover:scale-105 transition-transform gap-2 w-full sm:w-auto"
              onClick={() => navigate('/demo')}
            >
              <FlaskConical className="w-5 h-5" />
              Voir une démonstration
              <ArrowRight className="w-5 h-5" />
            </Button>

            {/* CTA 2 — Tester avec un fichier */}
            <Button
              variant="outline"
              size="lg"
              className="h-13 px-6 text-base border-border hover:border-primary/50 gap-2 w-full sm:w-auto"
              onClick={() => navigate('/tools')}
            >
              <Upload className="w-5 h-5" />
              Tester avec un fichier
            </Button>

            {/* CTA 3 — Demander démo commerciale */}
            <Button
              variant="ghost"
              size="lg"
              className="h-13 px-6 text-base text-muted-foreground hover:text-foreground gap-2 w-full sm:w-auto"
              onClick={() => setDemoDialogOpen(true)}
            >
              <Calendar className="w-5 h-5" />
              Demander une démo
            </Button>
          </motion.div>

          {/* Social proof / trust */}
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap justify-center items-center gap-6 pt-4 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span>100% conforme RGPD</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span>Prêt pour NIS2</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span>Hébergé en France 🇫🇷</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-primary font-medium">490€ TTC / an tout inclus</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

      <DemoRequestDialog
        open={demoDialogOpen}
        onOpenChange={setDemoDialogOpen}
        ctaOrigin="hero_cta"
        sourcePage="/"
      />
    </section>
  );
}
