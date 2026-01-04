import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { FileSignature, Upload, FileText } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: FileSignature,
    title: "Autorisation",
    description: "Uploadez une preuve d'autorisation légale (attestation, mandat). 100% conforme.",
  },
  {
    number: "02",
    icon: Upload,
    title: "Import",
    description: "Importez les résultats de vos outils de sécurité (nmap, nuclei, etc.). Aucune intrusion.",
  },
  {
    number: "03",
    icon: FileText,
    title: "Rapports & Preuves",
    description: "Recevez un rapport Direction + un rapport Technique. Vos preuves dans l'Evidence Vault.",
  },
];

export function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} id="how-it-works" className="relative py-24 overflow-hidden">
      <div className="container px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <span className="inline-block px-3 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full mb-4">
              Processus
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              3 étapes simples pour passer de l'incertitude à la maîtrise de votre risque cyber.
            </p>
          </motion.div>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent -translate-y-1/2" />

            <div className="grid md:grid-cols-3 gap-6">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  className="relative group"
                >
                  <div className="relative p-6 rounded-xl glass-card hover:bg-secondary/30 transition-all duration-300 h-full">
                    {/* Step number */}
                    <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold neon-glow">
                      {step.number}
                    </div>

                    <div className="space-y-4">
                      <div className="w-14 h-14 rounded-xl bg-secondary/50 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                        <step.icon className="w-7 h-7" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {step.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
