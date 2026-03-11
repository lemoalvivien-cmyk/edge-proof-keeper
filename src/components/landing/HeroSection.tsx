import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, ArrowRight, Sparkles, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export function HeroSection() {
  const [domain, setDomain] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Simple domain regex validation
  const isValidDomain = (d: string) => {
    const regex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    return regex.test(d.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!domain.trim()) {
      toast({
        title: "Domaine requis",
        description: "Veuillez entrer votre domaine pour continuer.",
        variant: "destructive",
      });
      return;
    }

    if (!isValidDomain(domain)) {
      toast({
        title: "Domaine invalide",
        description: "Veuillez entrer un domaine valide (ex: entreprise.fr)",
        variant: "destructive",
      });
      return;
    }

    setIsValidating(true);
    
    // Store domain in localStorage for the wizard
    localStorage.setItem("sentinel_domain", domain.trim());
    
    // Small delay for UX
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    // Navigate to tools page with domain
    navigate(`/tools?domain=${encodeURIComponent(domain.trim())}`);
  };

  const scrollToPricing = () => {
    const element = document.getElementById("pricing");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24">
      {/* Background effects */}
      <div className="absolute inset-0 gradient-radial" />
      <div className="absolute inset-0 grid-pattern opacity-10" />
      
      {/* Floating orbs - with reduced motion support */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl"
        style={{ 
          animation: "float 6s ease-in-out infinite",
        }}
      />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
        style={{ 
          animation: "float 6s ease-in-out infinite",
          animationDelay: "-3s",
        }}
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
              Plateforme de gouvernance cyber nouvelle génération
            </span>
          </motion.div>

          {/* Main heading */}
          <motion.h1
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight"
          >
            <span className="text-foreground">Votre </span>
            <span className="text-gradient neon-text">armure</span>
            <br />
            <span className="text-foreground">de gouvernance cyber</span>
          </motion.h1>

          {/* Subtitle - dirigeants focused */}
          <motion.p
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            En 10 minutes : preuves de diligence + plan d'action.
            <br className="hidden sm:block" />
            <span className="text-foreground font-medium">Zéro jargon pour la Direction.</span>
          </motion.p>

          {/* Domain input form */}
          <motion.form
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            onSubmit={handleSubmit}
            className="max-w-xl mx-auto"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="votre-entreprise.fr"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="h-14 pl-4 pr-4 text-lg bg-secondary/50 border-border focus:border-primary focus:ring-primary/20 placeholder:text-muted-foreground/50"
                  disabled={isValidating}
                />
              </div>
              <Button 
                type="submit" 
                size="lg"
                className="h-14 px-6 text-base font-semibold neon-glow hover:scale-105 transition-transform whitespace-nowrap"
                disabled={isValidating}
              >
                <Shield className="w-5 h-5 mr-2" />
                {isValidating ? "Validation..." : "Obtenir mon rapport choc gratuit"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.form>

          {/* Secondary CTA */}
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
          >
            <Button
              variant="outline"
              size="lg"
              onClick={scrollToPricing}
              className="border-primary/50 text-primary hover:bg-primary/10"
            >
              Voir l'offre — 490€ TTC/an
            </Button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            variants={fadeInUp}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap justify-center items-center gap-6 pt-8 text-sm text-muted-foreground"
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
              <span>Données hébergées en France 🇫🇷</span>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
