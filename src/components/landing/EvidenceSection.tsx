import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Lock, FileCheck, Link2, Shield, Database, Hash } from "lucide-react";

const features = [
  {
    icon: Database,
    title: "Evidence Vault",
    description: "Coffre-fort de preuves immuable. Chaque action est horodatée, signée et traçable.",
    highlight: "Traçabilité totale",
    color: "text-primary",
    glow: "hsl(185 100% 52%)",
  },
  {
    icon: Hash,
    title: "Chaîne de Hash",
    description: "Intégrité vérifiable par chaîne cryptographique SHA-256 enchaînée.",
    highlight: "Inviolable",
    color: "text-accent",
    glow: "hsl(258 90% 66%)",
  },
  {
    icon: FileCheck,
    title: "Proof Packs",
    description: "Exportez des packs de preuves vérifiables et opposables pour vos audits.",
    highlight: "Opposables",
    color: "text-success",
    glow: "hsl(158 80% 46%)",
  },
];

const trustItems = [
  { icon: Lock, label: "Chiffrement bout-en-bout" },
  { icon: Shield, label: "Conforme RGPD" },
  { icon: Link2, label: "Prêt pour NIS2" },
  { icon: () => <span className="text-base">🇫🇷</span>, label: "Hébergé en France" },
];

export function EvidenceSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className="relative py-28 overflow-hidden">
      {/* Subtle dark section */}
      <div className="absolute inset-0 bg-secondary/10" />
      <div className="absolute inset-0 grid-pattern-fine opacity-30" />

      <div className="container relative px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-14 space-y-4"
          >
            <div className="label-badge label-badge-cyan mx-auto w-fit">
              Conformité &amp; Preuve
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Des preuves <span className="text-gradient">incontestables</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Constituez un dossier de preuves solide et certifié pour démontrer votre diligence 
              face aux régulateurs, assureurs et partenaires.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 36 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.12, ease: "easeOut" }}
                className="group relative p-6 rounded-2xl glass-card border border-border hover:border-primary/20 transition-all duration-500 card-3d"
              >
                {/* Glow spot */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(circle at 30% 30%, ${feature.glow}15 0%, transparent 60%)` }}
                />

                <div className="relative">
                  <div className="flex items-start justify-between mb-5">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center ${feature.color} group-hover:scale-110 transition-transform duration-300`}
                      style={{ background: `${feature.glow}18`, border: `1px solid ${feature.glow}25` }}
                    >
                      <feature.icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`label-badge ${feature.color === "text-primary" ? "label-badge-cyan" : feature.color === "text-accent" ? "label-badge-purple" : "label-badge-green"}`}
                    >
                      {feature.highlight}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.45, ease: "easeOut" }}
            className="mt-10 p-5 rounded-2xl glass-card-premium"
          >
            <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
              {trustItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 group">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary/20 transition-colors">
                    <item.icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="group-hover:text-foreground transition-colors">{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
