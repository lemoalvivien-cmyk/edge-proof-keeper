import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Building2, Monitor, Scale, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const audiences = [
  {
    icon: Building2,
    title: "Direction Générale · DG · CEO",
    benefit: "Un seul chiffre. Une seule décision.",
    description: "Score de maturité 0–100, risques critiques en langage business, ROI cyber prouvé. Validez les décisions stratégiques en 1 clic — sans jamais ouvrir un rapport technique.",
    quote: "Enfin un outil que je comprends en 30 secondes.",
    color: "text-primary",
    glow: "hsl(185 100% 52%)",
    badge: "CEO · DG · DAF",
    badgeColor: "label-badge-cyan",
  },
  {
    icon: Monitor,
    title: "DSI · RSSI · CTO",
    benefit: "Mode autonomous ou Go/No-Go : vous choisissez.",
    description: "Visibilité technique totale sur 847 endpoints. Validez chaque remédiation en 1 clic, ou déléguez au Swarm supervisé. Evidence Vault SHA-256 Merkle Chain pour chaque action.",
    quote: "Je valide en 1 clic. L'agent exécute. La preuve est dans le Vault 30s plus tard.",
    color: "text-accent",
    glow: "hsl(258 90% 66%)",
    badge: "DSI · RSSI · CTO",
    badgeColor: "label-badge-purple",
  },
  {
    icon: Scale,
    title: "DPO · Juridique · Audit",
    benefit: "Votre dossier NIS2 prêt en 10 minutes.",
    description: "Proof Packs exportables, trail complet, conformité documentée automatiquement. Opposable à l'ANSSI, à la CNIL, aux assureurs et aux tribunaux — sans effort manuel.",
    quote: "Notre prime d'assurance cyber a été divisée par 2 grâce aux Proof Packs.",
    color: "text-success",
    glow: "hsl(158 80% 46%)",
    badge: "DPO · Juridique · Audit",
    badgeColor: "label-badge-green",
  },
];

export function AudienceSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.18 });
  const navigate = useNavigate();

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
              Conçu pour ceux qui décident,
              <br />
              <span className="text-gradient">pas pour ceux qui scriptent</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Direction, DSI, DPO : chaque rôle trouve sa valeur immédiate. Une vision unifiée, des preuves partagées, zéro traduction technique.
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
                  className="group relative p-6 rounded-2xl glass-card border border-border hover:border-primary/25 transition-all duration-500 overflow-hidden flex flex-col"
                >
                  <div
                    className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: `radial-gradient(circle at 30% 20%, ${audience.glow}08 0%, transparent 60%)` }}
                  />

                  <div className="relative space-y-4 flex-1">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${audience.color} group-hover:scale-110 transition-transform duration-300`}
                        style={{ background: `${audience.glow}18`, border: `1px solid ${audience.glow}28` }}
                      >
                        <AudienceIcon className="w-5 h-5" />
                      </div>
                      <span className={`label-badge ${audience.badgeColor} text-[10px]`}>{audience.badge}</span>
                    </div>

                    <div>
                      <h3 className="text-lg font-bold text-foreground leading-tight">{audience.title}</h3>
                      <p className={`text-sm font-semibold mt-1 ${audience.color}`}>{audience.benefit}</p>
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">{audience.description}</p>
                  </div>

                  {/* Quote */}
                  <div className="relative mt-4 pt-4 border-t border-border/40">
                    <p className="text-xs text-foreground/70 italic">"{audience.quote}"</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Bottom CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-10 p-6 rounded-2xl glass-card border border-primary/15 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div>
              <p className="text-base font-bold text-foreground">SECURIT-E est le premier système immunitaire cyber souverain français.</p>
              <p className="text-sm text-muted-foreground">Opérationnel en 15 minutes. Aucune équipe RSSI requise. ROI dès le premier incident évité.</p>
            </div>
            <button
              onClick={() => navigate('/auth?tab=signup')}
              className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold neon-glow hover:scale-[1.02] transition-transform whitespace-nowrap"
            >
              Démarrer maintenant <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
