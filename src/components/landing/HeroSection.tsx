import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function HeroSection() {
  const [domain, setDomain] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Store domain and navigate to wizard
    if (domain) {
      sessionStorage.setItem("sentinel_domain", domain);
      navigate("/authorization/new");
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 gradient-radial" />
      <div className="absolute inset-0 grid-pattern opacity-20" />
      
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl float" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl float" style={{ animationDelay: "-3s" }} />

      <div className="container relative z-10 px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border-glow">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm text-muted-foreground">
              Plateforme de gouvernance cyber nouvelle génération
            </span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight">
            <span className="text-foreground">Votre </span>
            <span className="text-gradient neon-text">armure</span>
            <br />
            <span className="text-foreground">de gouvernance cyber</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Protégez votre entreprise, prouvez votre conformité RGPD & NIS2, 
            et dormez sur vos deux oreilles. Sans jargon technique.
          </p>

          {/* Domain input form */}
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="votre-entreprise.fr"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="h-14 pl-4 pr-4 text-lg bg-secondary/50 border-border focus:border-primary focus:ring-primary/20 placeholder:text-muted-foreground/50"
                />
              </div>
              <Button 
                type="submit" 
                size="lg"
                className="h-14 px-8 text-lg font-semibold neon-glow hover:scale-105 transition-transform"
              >
                <Shield className="w-5 h-5 mr-2" />
                Obtenir mon rapport choc gratuit
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </form>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center items-center gap-6 pt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span>100% conforme RGPD</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span>Prêt pour NIS2</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span>Données hébergées en France</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
