import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Building2, Monitor, Scale, Sparkles, Cpu } from "lucide-react";

const audiences = [
  {
    icon: Building2,
    title: "Direction Générale",
    benefit: "Pilotage sans jargon",
    description: "Brief exécutif mensuel par le RSSI Virtuel IA. Score de maturité, risques critiques, ROI cyber. Validez les décisions critiques en 1 clic.",
    color: "text-primary",
    glow: "hsl(185 100% 52%)",
    badge: "CEO · DG · DAF",
  },
  {
    icon: Monitor,
    title: "DSI / RSSI",
    benefit: "Mode fully autonomous ou Go/No-Go",
    description: "Choisissez : les agents opèrent seuls ou vous validez chaque action en 1 clic. Visibilité technique totale avec Evidence Vault post-quantique.",
    color: "text-accent",
    glow: "hsl(258 90% 66%)",
    badge: "DSI · RSSI · CTO",
  },
  {
    icon: Scale,
    title: "Juridique / DPO",
    benefit: "Preuves NIS2 + RGPD prêtes",
    description: "Proof Packs exportables, trail complet, conformité documentée. Votre dossier est prêt pour n'importe quel audit en 10 minutes.",
    color: "text-success",
    glow: "hsl(158 80% 46%)",
    badge: "DPO · Juridique · Audit",
  },
];

export function AudienceSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className="relative py-28 overflow-hidden">
      <div className="container px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-14 space-y-4"
          >
            <div className="label-badge label-badge-purple mx-auto w-fit">
              <Sparkles className="w-3 h-3" />
              Pour qui ?
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Un système immunitaire pour{" "}
              <span className="text-gradient">toute l'entreprise</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Direction, DSI, DPO : chaque rôle trouve sa valeur. Une vision unifiée, des preuves partagées.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-5">
            {audiences.map((audience, index) => {
              const AudienceIcon = audience.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 40 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: index * 0.12, ease: "easeOut" }}
                  className="group relative p-6 rounded-2xl glass-card border border-border hover:border-primary/20 transition-all duration-500 card-3d overflow-hidden"
                >
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at 30% 20%, ${audience.glow}10 0%, transparent 60%)` }}
                  />

                  <div className="relative space-y-4">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${audience.color} group-hover:scale-110 transition-transform duration-300`}
                        style={{ background: `${audience.glow}18`, border: `1px solid ${audience.glow}25` }}
                      >
                        <AudienceIcon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] text-muted-foreground/60 font-mono bg-secondary/50 px-2 py-1 rounded-full">
                        {audience.badge}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{audience.title}</h3>
                      <p className={`text-sm font-semibold mt-0.5 ${audience.color}`}>{audience.benefit}</p>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">{audience.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Swarm visual summary */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-10 p-5 rounded-2xl glass-card border border-primary/15 text-center"
          >
            <Cpu className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-semibold">Sentinel Immune</span> est le premier Digital Immune System souverain français.{" "}
              20 ans d'avance sur vos concurrents. Zéro équipe cyber. 100% autonome.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
