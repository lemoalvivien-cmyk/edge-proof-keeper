import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Lock, FileCheck, Link2, Shield, Database, Hash } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const features = [
  {
    icon: Database,
    title: "Evidence Vault",
    description: "Coffre-fort de preuves immuable. Chaque action est horodatée et signée.",
    highlight: "Traçabilité totale",
  },
  {
    icon: Hash,
    title: "Chaîne de Hash",
    description: "Intégrité vérifiable par chaîne cryptographique SHA-256.",
    highlight: "Inviolable",
  },
  {
    icon: FileCheck,
    title: "Proof Packs",
    description: "Exportez des packs de preuves vérifiables pour vos audits.",
    highlight: "Opposables",
  },
];

export function EvidenceSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className="relative py-24 overflow-hidden bg-muted/30">
      <div className="container px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <span className="inline-block px-3 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full mb-4">
              Conformité & Preuve
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Des preuves <span className="text-gradient">incontestables</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Constituez un dossier de preuves solide pour démontrer votre diligence 
              face aux régulateurs, assureurs et partenaires.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full glass-card hover:bg-secondary/30 transition-all duration-300 group">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <feature.icon className="w-6 h-6" />
                      </div>
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                        {feature.highlight}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-12 p-6 rounded-xl bg-primary/5 border border-primary/20"
          >
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                <span>Chiffrement bout-en-bout</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <span>Conforme RGPD</span>
              </div>
              <div className="flex items-center gap-2">
                <Link2 className="w-5 h-5 text-primary" />
                <span>Prêt pour NIS2</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">🇫🇷</span>
                <span>Hébergé en France</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
