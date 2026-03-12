import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { AlertTriangle, Scale, Shield, FileWarning, TrendingDown } from "lucide-react";

const painPoints = [
  {
    icon: AlertTriangle,
    title: "Responsabilité personnelle du dirigeant",
    description: "NIS2 et RGPD peuvent engager votre responsabilité personnelle. Une cyberattaque mal gérée = risque pénal direct.",
    tag: "CRITIQUE",
    tagColor: "label-badge-red",
    borderColor: "border-destructive/20 hover:border-destructive/40",
    glowColor: "hsl(4 90% 58% / 0.08)",
  },
  {
    icon: Scale,
    title: "Amendes jusqu'à 4% du CA",
    description: "Les régulateurs européens n'hésitent plus. Sans preuves de diligence documentée, vous êtes exposé.",
    tag: "HAUTE",
    tagColor: "label-badge-red",
    borderColor: "border-warning/20 hover:border-warning/40",
    glowColor: "hsl(42 96% 54% / 0.06)",
  },
  {
    icon: Shield,
    title: "Assurance cyber refusée",
    description: "Les assureurs exigent des preuves de maturité cyber. Sans documentation, pas de couverture en cas d'incident.",
    tag: "HAUTE",
    tagColor: "label-badge-red",
    borderColor: "border-warning/20 hover:border-warning/40",
    glowColor: "hsl(42 96% 54% / 0.06)",
  },
  {
    icon: FileWarning,
    title: "Jargon technique incompréhensible",
    description: "CVE, CVSS, patches... Vous avez besoin de risques business et de plans d'action en langage Direction.",
    tag: "MOYENNE",
    tagColor: "label-badge-purple",
    borderColor: "border-accent/20 hover:border-accent/40",
    glowColor: "hsl(258 90% 66% / 0.06)",
  },
];

const container = {
  initial: {},
  animate: { transition: { staggerChildren: 0.1 } },
};

const cardVariant = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.23, 1, 0.32, 1] } },
};

export function PainSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section ref={ref} className="relative py-28 overflow-hidden">
      {/* Section bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-destructive/3 to-transparent" />
      <div className="absolute inset-0 grid-pattern-fine opacity-40" />

      <div className="container relative px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            className="text-center mb-16 space-y-4"
          >
            <div className="label-badge label-badge-red mx-auto w-fit">
              <TrendingDown className="w-3 h-3" />
              Le problème
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              En 2026, votre direction est{" "}
              <span className="text-destructive" style={{ textShadow: "0 0 40px hsl(4 90% 58% / 0.4)" }}>
                personnellement exposée
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Cyberattaques, réglementations, assurances... Le risque cyber est devenu le risque métier n°1 des PME européennes.
            </p>
          </motion.div>

          {/* Pain cards — asymmetric bento layout */}
          <motion.div
            variants={container}
            initial="initial"
            animate={isInView ? "animate" : "initial"}
            className="grid md:grid-cols-2 gap-4"
          >
            {painPoints.map((point, index) => (
              <motion.div
                key={index}
                variants={cardVariant}
                className={`relative group p-6 rounded-2xl glass-card border transition-all duration-500 card-3d ${point.borderColor}`}
                style={{
                  background: `linear-gradient(135deg, ${point.glowColor} 0%, hsl(var(--glass) / 0.6) 100%)`,
                }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-2.5 rounded-xl`} style={{ background: point.glowColor, border: `1px solid ${point.glowColor}` }}>
                    <point.icon className="w-5 h-5 text-foreground/70" />
                  </div>
                  <div className={`label-badge ${point.tagColor}`}>{point.tag}</div>
                </div>

                <h3 className="text-base font-semibold text-foreground mb-2 leading-snug">{point.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{point.description}</p>

                {/* Hover line */}
                <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-20 transition-opacity" />
              </motion.div>
            ))}
          </motion.div>

          {/* Stat highlight */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="mt-12 flex justify-center"
          >
            <div className="inline-flex items-center gap-6 px-8 py-5 rounded-2xl border border-destructive/25 glass-card"
              style={{ background: "linear-gradient(135deg, hsl(4 90% 58% / 0.08) 0%, hsl(var(--glass) / 0.7) 100%)" }}>
              <div className="text-center">
                <div className="text-5xl font-bold font-mono text-destructive" style={{ textShadow: "0 0 30px hsl(4 90% 58% / 0.4)" }}>60%</div>
                <div className="text-xs text-muted-foreground mt-1 font-mono">des PME victimes</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                font <span className="text-foreground font-semibold">faillite dans les 6 mois</span> après une cyberattaque faute de préparation documentée.
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
