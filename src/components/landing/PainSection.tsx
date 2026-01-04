import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { AlertTriangle, Scale, Shield, FileWarning } from "lucide-react";

const painPoints = [
  {
    icon: AlertTriangle,
    title: "Responsabilité personnelle du dirigeant",
    description: "NIS2 et RGPD peuvent engager votre responsabilité personnelle. Une cyberattaque mal gérée = risque pénal.",
    color: "text-destructive",
  },
  {
    icon: Scale,
    title: "Amendes jusqu'à 4% du CA",
    description: "Les régulateurs européens n'hésitent plus. Sans preuves de diligence, vous êtes exposé.",
    color: "text-warning",
  },
  {
    icon: Shield,
    title: "Assurance cyber refusée",
    description: "Les assureurs exigent des preuves de maturité cyber. Sans elles, pas de couverture en cas d'incident.",
    color: "text-warning",
  },
  {
    icon: FileWarning,
    title: "Jargon technique incompréhensible",
    description: "Vos équipes IT parlent vulnérabilités CVE et patches. Vous avez besoin de risques business et plans d'action.",
    color: "text-muted-foreground",
  },
];

export function PainSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className="relative py-24 overflow-hidden">
      <div className="container px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-3 py-1 text-xs font-medium text-destructive bg-destructive/10 rounded-full mb-4">
              Le problème
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Dirigeant d'entreprise en 2025 :<br />
              <span className="text-destructive">vous êtes personnellement exposé</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Cyberattaques, réglementations, assurances... Le risque cyber est devenu un risque métier majeur.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6">
            {painPoints.map((point, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="group relative p-6 rounded-xl glass-card hover:bg-secondary/30 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-secondary/50 ${point.color}`}>
                    <point.icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">
                      {point.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {point.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stat highlight */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-16 text-center"
          >
            <div className="inline-flex items-center gap-4 px-8 py-4 rounded-xl bg-destructive/10 border border-destructive/30">
              <span className="text-4xl font-bold text-destructive">60%</span>
              <span className="text-left text-sm text-muted-foreground">
                des PME victimes de cyberattaque<br />
                font faillite dans les 6 mois
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
