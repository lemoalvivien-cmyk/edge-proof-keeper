import { Shield, CheckCircle2, Eye, FileCheck } from "lucide-react";

const benefits = [
  "Comprenez votre niveau de risque en 5 minutes",
  "Pilotez votre conformité RGPD & NIS2 sans jargon",
  "Générez des preuves opposables aux régulateurs",
  "Suivez vos progrès avec un tableau de bord clair",
];

export function PromiseSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container relative px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Visual */}
            <div className="relative order-2 lg:order-1">
              <div className="relative aspect-square max-w-md mx-auto">
                {/* Central shield */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full bg-primary/10 flex items-center justify-center neon-glow pulse-glow">
                    <Shield className="w-24 h-24 text-primary" />
                  </div>
                </div>
                
                {/* Orbiting icons */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <div className="w-16 h-16 rounded-full glass-card flex items-center justify-center float">
                    <Eye className="w-8 h-8 text-accent" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
                  <div className="w-16 h-16 rounded-full glass-card flex items-center justify-center float" style={{ animationDelay: "-2s" }}>
                    <FileCheck className="w-8 h-8 text-success" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Content */}
            <div className="space-y-8 order-1 lg:order-2">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold">
                  <span className="text-gradient">SENTINEL EDGE</span>
                  <br />
                  <span className="text-foreground">votre bouclier cyber</span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  Une plateforme tout-en-un qui traduit la complexité cyber 
                  en actions simples et preuves concrètes.
                </p>
              </div>

              {/* Benefits list */}
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex items-center gap-4 pt-4">
                <span className="text-3xl font-bold text-primary">490€</span>
                <div className="text-sm text-muted-foreground">
                  TTC / an<br />
                  <span className="text-foreground">Tout inclus, sans surprise</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
