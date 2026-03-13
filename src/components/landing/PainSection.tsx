import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { AlertTriangle, Scale, Shield, Clock, TrendingDown } from "lucide-react";

const painPoints = [
  {
    icon: AlertTriangle,
    title: "NIS2 : amendes jusqu'à 10M€ ou 2% CA mondial",
    description: "Les DSI et DG sont personnellement responsables. En cas d'incident non documenté, vous êtes seul face au régulateur et à l'assureur.",
    tag: "CRITIQUE",
    tagColor: "label-badge-red",
    borderColor: "border-destructive/25 hover:border-destructive/50",
    glowColor: "hsl(4 90% 58% / 0.08)",
    size: "lg",
  },
  {
    icon: Scale,
    title: "Responsabilité personnelle du dirigeant",
    description: "RGPD + NIS2 créent une responsabilité pénale directe. Sans preuves de diligence : risque pénal non-négociable.",
    tag: "CRITIQUE",
    tagColor: "label-badge-red",
    borderColor: "border-destructive/20 hover:border-destructive/40",
    glowColor: "hsl(4 90% 58% / 0.06)",
    size: "sm",
  },
  {
    icon: Clock,
    title: "3 mois pour constituer un dossier de preuves",
    description: "Votre assureur cyber exige des preuves de maturité. Sans Evidence Vault, vous perdez 3 mois à rassembler des documents épars.",
    tag: "HAUTE",
    tagColor: "label-badge-red",
    borderColor: "border-warning/20 hover:border-warning/40",
    glowColor: "hsl(42 96% 54% / 0.06)",
    size: "sm",
  },
  {
    icon: Shield,
    title: "Assurance cyber refusée ou prime doublée",
    description: "Sans documentation structurée de votre posture cyber, les assureurs refusent ou facturent des primes prohibitives.",
    tag: "HAUTE",
    tagColor: "label-badge-red",
    borderColor: "border-warning/20 hover:border-warning/40",
    glowColor: "hsl(42 96% 54% / 0.06)",
    size: "sm",
  },
];

const container = { initial: {}, animate: { transition: { staggerChildren: 0.1 } } };
const cardVariant = { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } } as const;

export function PainSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.12 });

  return (
    <section ref={ref} className="relative py-28 overflow-hidden" id="problem">
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
              Le Problème 2026
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              En 2026, la cyber n'est plus{" "}
              <span className="text-destructive" style={{ textShadow: "0 0 40px hsl(4 90% 58% / 0.4)" }}>
                un problème IT
              </span>
              {" "}— c'est votre risque pénal
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              NIS2, RGPD, assureurs exigeants : chaque semaine sans gouvernance documentée est une semaine d'exposition directe.
            </p>
          </motion.div>

          {/* Bento pain grid */}
          <motion.div
            variants={container}
            initial="initial"
            animate={isInView ? "animate" : "initial"}
            className="grid md:grid-cols-3 gap-4"
          >
            {/* Big card — span 2 */}
            <motion.div
              variants={cardVariant}
              className={`relative group md:col-span-2 p-7 rounded-2xl glass-card border transition-all duration-500 ${painPoints[0].borderColor}`}
              style={{ background: `linear-gradient(135deg, ${painPoints[0].glowColor} 0%, hsl(var(--glass) / 0.6) 100%)` }}
            >
              <div className="flex items-start justify-between mb-5">
                <div className="p-3 rounded-xl" style={{ background: painPoints[0].glowColor }}>
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div className={`label-badge ${painPoints[0].tagColor}`}>{painPoints[0].tag}</div>
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3">{painPoints[0].title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{painPoints[0].description}</p>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-destructive/30 to-transparent" />
            </motion.div>

            {/* Small cards */}
            {painPoints.slice(1).map((point, index) => (
              <motion.div
                key={index}
                variants={cardVariant}
                className={`relative group p-6 rounded-2xl glass-card border transition-all duration-500 ${point.borderColor}`}
                style={{ background: `linear-gradient(135deg, ${point.glowColor} 0%, hsl(var(--glass) / 0.6) 100%)` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 rounded-xl" style={{ background: point.glowColor }}>
                    <point.icon className="w-5 h-5 text-foreground/70" />
                  </div>
                  <div className={`label-badge ${point.tagColor}`}>{point.tag}</div>
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-2 leading-snug">{point.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{point.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Agitation stat */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="mt-12 flex justify-center"
          >
            <div className="inline-flex flex-col sm:flex-row items-center gap-6 px-8 py-5 rounded-2xl border border-destructive/25 glass-card"
              style={{ background: "linear-gradient(135deg, hsl(4 90% 58% / 0.08) 0%, hsl(var(--glass) / 0.7) 100%)" }}>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-5xl font-bold font-mono text-destructive" style={{ textShadow: "0 0 30px hsl(4 90% 58% / 0.4)" }}>60%</div>
                  <div className="text-xs text-muted-foreground mt-1 font-mono">des PME victimes</div>
                </div>
                <div className="w-px h-12 bg-border hidden sm:block" />
                <div className="text-center">
                  <div className="text-5xl font-bold font-mono text-warning" style={{ textShadow: "0 0 30px hsl(42 96% 54% / 0.4)" }}>10M€</div>
                  <div className="text-xs text-muted-foreground mt-1 font-mono">amende NIS2 max</div>
                </div>
              </div>
              <div className="w-px h-12 bg-border hidden sm:block" />
              <div className="text-sm text-muted-foreground max-w-xs leading-relaxed text-center sm:text-left">
                font <span className="text-foreground font-semibold">faillite dans les 6 mois</span> après une cyberattaque faute de préparation documentée.
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
