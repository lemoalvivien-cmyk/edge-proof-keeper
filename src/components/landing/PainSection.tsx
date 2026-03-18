import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { AlertTriangle, Scale, Shield, Clock, TrendingDown, Building2 } from "lucide-react";

const painPoints = [
  {
    icon: AlertTriangle,
    title: "NIS2 : amendes jusqu'à 10M€ ou 2% de votre CA mondial",
    description: "Les DSI et DG sont personnellement responsables devant le régulateur. En cas d'incident non documenté, vous êtes seul face à l'ANSSI, à l'assureur, et au tribunal.",
    tag: "CRITIQUE",
    tagColor: "label-badge-red",
    borderColor: "border-destructive/30 hover:border-destructive/55",
    glowColor: "hsl(4 90% 58% / 0.08)",
  },
  {
    icon: Scale,
    title: "Responsabilité pénale directe du dirigeant",
    description: "RGPD + NIS2 créent une responsabilité personnelle sans précédent. Sans preuves de diligence horodatées : risque pénal non-négociable pour vous.",
    tag: "CRITIQUE",
    tagColor: "label-badge-red",
    borderColor: "border-destructive/20 hover:border-destructive/40",
    glowColor: "hsl(4 90% 58% / 0.05)",
  },
  {
    icon: Clock,
    title: "3 mois perdus à constituer un dossier de preuves",
    description: "Votre assureur cyber exige des preuves de maturité. Sans Evidence Vault automatisé, vos équipes passent 3 mois à rassembler des documents épars.",
    tag: "COÛT CACHÉ",
    tagColor: "label-badge-red",
    borderColor: "border-warning/25 hover:border-warning/45",
    glowColor: "hsl(42 96% 54% / 0.05)",
  },
  {
    icon: Shield,
    title: "Assurance cyber refusée ou prime multipliée par 3",
    description: "Sans documentation structurée de votre posture cyber, les assureurs refusent ou appliquent des surprimes qui ruinent votre budget IT.",
    tag: "RISQUE DIRECT",
    tagColor: "label-badge-red",
    borderColor: "border-warning/25 hover:border-warning/45",
    glowColor: "hsl(42 96% 54% / 0.05)",
  },
];

const container = { initial: {}, animate: { transition: { staggerChildren: 0.1 } } };
const cardVariant = { initial: { opacity: 0, y: 36 }, animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } } as const;

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
              Le Risque Réel 2026
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              En 2026, chaque semaine sans gouvernance cyber{" "}
              <br className="hidden md:block" />
              <span className="text-destructive" style={{ textShadow: "0 0 40px hsl(4 90% 58% / 0.4)" }}>
                est une semaine d'exposition pénale directe
              </span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Ce n'est plus un sujet IT. C'est un sujet de direction, de conformité et de survie d'entreprise.
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
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-destructive/40 to-transparent" />
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

          {/* Agitation stats */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
            className="mt-12"
          >
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                {
                  value: "60%",
                  color: "text-destructive",
                  shadow: "0 0 30px hsl(4 90% 58% / 0.35)",
                  label: "des PME victimes font faillite dans les 6 mois",
                  sub: "Faute de préparation documentée",
                  icon: Building2,
                },
                {
                  value: "10M€",
                  color: "text-warning",
                  shadow: "0 0 30px hsl(42 96% 54% / 0.35)",
                  label: "d'amende maximum NIS2",
                  sub: "Par incident non documenté",
                  icon: AlertTriangle,
                },
                {
                  value: "180 000€",
                  color: "text-accent",
                  shadow: "0 0 30px hsl(258 90% 66% / 0.35)",
                  label: "coût moyen d'une cyberattaque PME",
                  sub: "vs. 490€/an avec SECURIT-E",
                  icon: TrendingDown,
                },
              ].map((stat, i) => (
                <div
                  key={i}
                  className="p-5 rounded-2xl glass-card border border-border/60 text-center flex flex-col items-center gap-2"
                >
                  <div className={`text-4xl font-bold font-mono ${stat.color}`} style={{ textShadow: stat.shadow }}>
                    {stat.value}
                  </div>
                  <p className="text-sm font-semibold text-foreground">{stat.label}</p>
                  <p className="text-xs text-muted-foreground">{stat.sub}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Bridge to solution */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="mt-10 text-center"
          >
            <p className="text-lg font-semibold text-foreground/80">
              Il existe maintenant une alternative souveraine et abordable.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Un centre de commandement cyber supervisé, opérationnel en 15 minutes.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
