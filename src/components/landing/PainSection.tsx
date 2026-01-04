import { AlertTriangle, Clock, Euro, Scale } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const painPoints = [
  {
    icon: Scale,
    title: "Vous êtes exposé sans le savoir",
    description: "RGPD, NIS2, amendes jusqu'à 4% du CA... La conformité n'est plus optionnelle.",
  },
  {
    icon: Clock,
    title: "Vous manquez de temps",
    description: "Entre la direction de votre entreprise et la cybersécurité, impossible de tout maîtriser.",
  },
  {
    icon: Euro,
    title: "Les consultants coûtent cher",
    description: "10 000€+ pour un audit ponctuel qui sera obsolète dans 6 mois.",
  },
  {
    icon: AlertTriangle,
    title: "Vous ne savez pas par où commencer",
    description: "Jargon technique, matrices de risques, preuves à fournir... C'est un labyrinthe.",
  },
];

export function PainSection() {
  return (
    <section className="relative py-24 overflow-hidden">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          {/* Section header */}
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-bold">
              Vous êtes <span className="text-destructive">vulnérable</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              En tant que dirigeant, vous êtes personnellement responsable de la sécurité 
              des données de votre entreprise. Et les régulateurs le savent.
            </p>
          </div>

          {/* Pain points grid */}
          <div className="grid md:grid-cols-2 gap-6 stagger-children">
            {painPoints.map((pain, index) => (
              <Card 
                key={index} 
                className="glass-card hover:border-destructive/50 transition-colors group"
              >
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/20 transition-colors">
                        <pain.icon className="w-6 h-6 text-destructive" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-foreground">
                        {pain.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {pain.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Stat highlight */}
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-4 px-8 py-4 rounded-xl bg-destructive/10 border border-destructive/30">
              <span className="text-4xl font-bold text-destructive">60%</span>
              <span className="text-left text-sm text-muted-foreground">
                des PME victimes de cyberattaque<br />
                font faillite dans les 6 mois
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
