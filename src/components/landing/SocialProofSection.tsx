import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ShieldCheck, Clock, Users, Cpu, FlaskConical } from "lucide-react";

const stats = [
  { icon: Users, value: "12", label: "ETI françaises en accès prioritaire", color: "text-primary" },
  { icon: ShieldCheck, value: "Closed", label: "Beta privée — candidatures ouvertes", color: "text-success" },
  { icon: Clock, value: "47s", label: "Cycle détection → preuve (mesuré en lab)", color: "text-accent" },
  { icon: FlaskConical, value: "Q2 2026", label: "Self-healing réel en déploiement", color: "text-warning" },
];

const betaSlots = [
  { label: "ETI industrielle", sector: "Industrie", size: "350 pers.", status: "Actif" },
  { label: "Cabinet comptable", sector: "Services", size: "45 pers.", status: "Actif" },
  { label: "SaaS B2B", sector: "Tech", size: "80 pers.", status: "Actif" },
];

export function SocialProofSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.12 });

  return (
    <section ref={ref} className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/20 to-transparent" />

      <div className="container relative px-4">
        <div className="max-w-6xl mx-auto space-y-20">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4"
          >
            <div className="label-badge label-badge-cyan mx-auto w-fit">
              <Cpu className="w-3 h-3" />
              Closed Beta
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              12 ETI françaises{" "}
              <span className="text-gradient">en accès prioritaire</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Programme beta fermé — résultats mesurés en environnement réel. 
              Témoignages publics disponibles au lancement officiel.
            </p>
          </motion.div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.08, ease: "easeOut" }}
                className="group relative p-5 rounded-2xl glass-card border border-border hover:border-primary/20 text-center transition-all duration-300 card-3d"
              >
                <div className={`w-10 h-10 mx-auto mb-3 rounded-xl bg-secondary/50 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-4.5 h-4.5" />
                </div>
                <div className={`text-2xl font-bold font-mono mb-1 ${stat.color}`}>{stat.value}</div>
                <p className="text-xs text-muted-foreground leading-snug">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Beta slots — honest placeholders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-8 text-center">
              Profils beta actuels (anonymisés)
            </p>
            <div className="grid md:grid-cols-3 gap-5">
              {betaSlots.map((slot, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 36 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.12, ease: "easeOut" }}
                  className="relative p-6 rounded-2xl glass-card border border-border hover:border-primary/20 transition-all duration-300 card-3d group"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="label-badge label-badge-cyan text-[9px] py-0.5">{slot.status}</span>
                    <span className="text-xs text-muted-foreground font-mono">{slot.size}</span>
                  </div>

                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                    <ShieldCheck className="w-5 h-5 text-primary/50" />
                  </div>

                  <p className="font-semibold text-foreground text-sm">{slot.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">Secteur : {slot.sector}</p>
                  <p className="text-xs text-muted-foreground/50 mt-3 italic">
                    Retour terrain disponible après accord de publication
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Beta disclaimer */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="p-5 rounded-2xl border border-warning/30 bg-warning/5 text-center"
          >
            <p className="text-sm text-warning/90 font-medium">
              ⚗️ Agents IA en beta — self-healing réel en cours de déploiement Q2 2026
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Les fonctionnalités de remédiation autonome sont actuellement disponibles en environnement contrôlé. 
              Déploiement production général prévu Q2 2026.
            </p>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
