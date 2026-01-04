import { Scan, FileSignature, LayoutDashboard, Award } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: FileSignature,
    title: "Autorisez le diagnostic",
    description: "Signez électroniquement votre consentement. Nous n'agissons jamais sans votre accord explicite.",
  },
  {
    number: "02",
    icon: Scan,
    title: "Lancez l'analyse",
    description: "Notre IA scanne vos actifs et identifie les failles de sécurité et écarts de conformité.",
  },
  {
    number: "03",
    icon: LayoutDashboard,
    title: "Pilotez sans jargon",
    description: "Tableau de bord double : vue dirigeant (synthèse) + vue technique (détails pour votre équipe IT).",
  },
  {
    number: "04",
    icon: Award,
    title: "Prouvez votre conformité",
    description: "Générez des rapports opposables et un journal de preuves inaltérable pour les audits.",
  },
];

export function HowItWorksSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="container px-4">
        <div className="max-w-5xl mx-auto">
          {/* Section header */}
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Comment ça <span className="text-gradient">fonctionne</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Quatre étapes simples pour passer de l'incertitude à la maîtrise totale.
            </p>
          </div>

          {/* Steps */}
          <div className="relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary/50 via-accent/50 to-primary/50" />

            <div className="space-y-12 lg:space-y-0">
              {steps.map((step, index) => (
                <div 
                  key={index}
                  className={`relative lg:grid lg:grid-cols-2 lg:gap-12 items-center ${
                    index % 2 === 1 ? "lg:text-right" : ""
                  }`}
                >
                  {/* Content */}
                  <div 
                    className={`space-y-4 ${
                      index % 2 === 1 ? "lg:order-2 lg:text-left" : "lg:order-1"
                    }`}
                  >
                    <div className="glass-card p-6 rounded-xl hover:border-primary/50 transition-colors group">
                      <div className={`flex items-start gap-4 ${
                        index % 2 === 1 ? "lg:flex-row" : ""
                      }`}>
                        <div className="flex-shrink-0">
                          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors neon-glow">
                            <step.icon className="w-7 h-7 text-primary" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-mono text-primary">{step.number}</span>
                            <h3 className="text-xl font-semibold text-foreground">
                              {step.title}
                            </h3>
                          </div>
                          <p className="text-muted-foreground">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Center dot */}
                  <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    <div className="w-4 h-4 rounded-full bg-primary neon-glow" />
                  </div>

                  {/* Empty column for layout */}
                  <div className={index % 2 === 1 ? "lg:order-1" : "lg:order-2"} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
