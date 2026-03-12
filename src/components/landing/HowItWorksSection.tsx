import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { FileSignature, Upload, FileText, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: FileSignature,
    title: "Autorisation légale",
    description: "Uploadez une preuve d'autorisation légale (attestation, mandat). 100% conforme et horodatée.",
    color: "text-primary",
    glowColor: "hsl(185 100% 52% / 0.1)",
    borderColor: "border-primary/20",
  },
  {
    number: "02",
    icon: Upload,
    title: "Import des outils",
    description: "Importez les résultats de vos outils de sécurité (nmap, nuclei, Burp...). Aucune intrusion, zéro friction.",
    color: "text-accent",
    glowColor: "hsl(258 90% 66% / 0.1)",
    borderColor: "border-accent/20",
  },
  {
    number: "03",
    icon: FileText,
    title: "Rapports & Preuves",
    description: "Rapport Direction + Technique générés en quelques clics. Preuves certifiées dans l'Evidence Vault.",
    color: "text-success",
    glowColor: "hsl(158 80% 46% / 0.1)",
    borderColor: "border-success/20",
  },
];

export function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} id="how-it-works" className="relative py-28 overflow-hidden">
      {/* Grid bg */}
      <div className="absolute inset-0 grid-pattern opacity-60" />

      <div className="container relative px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-16 space-y-4"
          >
            <div className="label-badge label-badge-cyan mx-auto w-fit">
              Processus
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Comment ça marche ?
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              3 étapes. 10 minutes. De l'incertitude à la maîtrise souveraine de votre risque cyber.
            </p>
          </motion.div>

          {/* Steps */}
          <div className="relative">
            {/* Desktop connector line */}
            <div className="hidden lg:block absolute top-16 left-0 right-0 h-px step-line opacity-30" />

            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.15, ease: "easeOut" }}
                  className="relative group"
                >
                  <div
                    className={`relative p-6 rounded-2xl glass-card border ${step.borderColor} hover:bg-secondary/20 transition-all duration-500 card-3d h-full`}
                    style={{ background: `linear-gradient(135deg, ${step.glowColor} 0%, hsl(var(--glass) / 0.6) 100%)` }}
                  >
                    {/* Step badge */}
                    <div className="flex items-center justify-between mb-5">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${step.color} group-hover:scale-110 transition-transform duration-300`}
                        style={{ background: step.glowColor, border: `1px solid ${step.glowColor}` }}
                      >
                        <step.icon className="w-5 h-5" />
                      </div>
                      <span className={`font-mono text-3xl font-bold opacity-20 ${step.color}`}>{step.number}</span>
                    </div>

                    <h3 className="text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>

                    {/* Arrow connector (not on last) */}
                    {index < steps.length - 1 && (
                      <div className="hidden lg:flex absolute -right-4 top-14 z-10 items-center justify-center w-8 h-8 rounded-full bg-background border border-border">
                        <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    )}
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
