import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Shield, CheckCircle2, Eye, FileCheck, Zap } from "lucide-react";

const benefits = [
  {
    icon: Eye,
    text: "Comprenez votre niveau de risque en 10 minutes",
  },
  {
    icon: FileCheck,
    text: "Générez des preuves opposables aux régulateurs",
  },
  {
    icon: Shield,
    text: "Pilotez votre conformité RGPD & NIS2 sans jargon",
  },
  {
    icon: Zap,
    text: "Obtenez un plan d'action clair et priorisé",
  },
];

export function PromiseSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <section ref={ref} className="relative py-24 overflow-hidden">
      {/* Background accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container relative px-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6 }}
              className="relative order-2 lg:order-1"
            >
              <div className="relative aspect-square max-w-md mx-auto">
                {/* Central shield */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-48 h-48 rounded-full bg-primary/10 flex items-center justify-center neon-glow pulse-glow">
                    <Shield className="w-24 h-24 text-primary" />
                  </div>
                </div>
                
                {/* Orbiting icons */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <div className="w-16 h-16 rounded-full glass-card flex items-center justify-center float">
                    <Eye className="w-8 h-8 text-accent" />
                  </div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"
                >
                  <div className="w-16 h-16 rounded-full glass-card flex items-center justify-center float" style={{ animationDelay: "-2s" }}>
                    <FileCheck className="w-8 h-8 text-success" />
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Right: Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="space-y-8 order-1 lg:order-2"
            >
              <div className="space-y-4">
                <span className="inline-block px-3 py-1 text-xs font-medium text-success bg-success/10 rounded-full">
                  La solution
                </span>
                <h2 className="text-3xl md:text-4xl font-bold">
                  <span className="text-gradient">SENTINEL EDGE</span>
                  <br />
                  <span className="text-foreground">votre bouclier cyber</span>
                </h2>
                <p className="text-lg text-muted-foreground">
                  Une plateforme tout-en-un qui traduit la complexité cyber 
                  en <span className="text-foreground font-medium">actions simples</span> et <span className="text-foreground font-medium">preuves concrètes</span>.
                </p>
              </div>

              {/* Benefits list */}
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                  >
                    <div className="p-2 rounded-lg bg-success/10">
                      <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                    </div>
                    <span className="text-foreground">{benefit.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* CTA */}
              <div className="flex items-center gap-4 pt-4 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <span className="text-3xl font-bold text-primary">490€</span>
                <div className="text-sm text-muted-foreground">
                  TTC / an<br />
                  <span className="text-foreground font-medium">Tout inclus, sans surprise</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
