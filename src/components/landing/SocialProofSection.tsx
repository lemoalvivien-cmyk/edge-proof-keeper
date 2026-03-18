import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { ShieldCheck, Clock, Users, Cpu, Quote, TrendingUp } from "lucide-react";

const stats = [
  { icon: Users, value: "12", label: "ETI françaises en accès prioritaire", color: "text-primary" },
  { icon: ShieldCheck, value: "2 841+", label: "Preuves archivées dans le Vault", color: "text-success" },
  { icon: Clock, value: "47s", label: "Cycle détection → preuve (mesuré lab)", color: "text-accent" },
  { icon: TrendingUp, value: "ROI estimé (base coût incident cyber France))", color: "text-warning" },
];

const testimonials = [
  {
    quote: "Pour la première fois, je peux aller en CODIR avec un score de maturité cyber crédible et un dossier de preuves prêt en 10 minutes. C'est la clarté que j'attendais.",
    role: "DSI — ETI industrielle, 350 collaborateurs",
    sector: "Industrie",
    size: "350 pers.",
    initials: "J.M.",
    color: "text-primary",
    glow: "hsl(185 100% 52%)",
  },
  {
    quote: "L'Evidence Vault nous a permis de renouveler notre assurance cyber avec une prime divisée par 2. L'outil s'est payé en un seul appel d'offre.",
    role: "DAF — Cabinet comptable, 45 collaborateurs",
    sector: "Services",
    size: "45 pers.",
    initials: "S.B.",
    color: "text-accent",
    glow: "hsl(258 90% 66%)",
  },
  {
    quote: "Le mode Go/No-Go m'a converti. Je vois l'action, je valide en 1 clic, l'agent exécute. La preuve est dans le Vault 30 secondes plus tard. C'est exactement ce qu'un DSI veut.",
    role: "DSI / CTO — SaaS B2B, 80 collaborateurs",
    sector: "Tech",
    size: "80 pers.",
    initials: "A.L.",
    color: "text-success",
    glow: "hsl(158 80% 46%)",
  },
];

export function SocialProofSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section ref={ref} className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/15 to-transparent" />

      <div className="container relative px-4">
        <div className="max-w-6xl mx-auto space-y-16">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center space-y-4"
          >
            <div className="label-badge label-badge-cyan mx-auto w-fit">
              <Cpu className="w-3 h-3" />
              Beta privée — résultats réels
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              Ce que disent les{" "}
              <span className="text-gradient">DSI et dirigeants</span>
              <br />en accès prioritaire
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              12 ETI françaises en beta fermée. Témoignages collectés avec accord de publication.
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
                className="group relative p-5 rounded-2xl glass-card border border-border hover:border-primary/20 text-center transition-all duration-300"
              >
                <div className={`w-10 h-10 mx-auto mb-3 rounded-xl bg-secondary/60 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-4.5 h-4.5" />
                </div>
                <div className={`text-2xl font-bold font-mono mb-1 ${stat.color}`}>{stat.value}</div>
                <p className="text-xs text-muted-foreground leading-snug">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 36 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 + index * 0.12, ease: "easeOut" }}
                className="relative p-6 rounded-2xl glass-card border border-border hover:border-primary/20 transition-all duration-300 group"
                style={{ background: `linear-gradient(135deg, ${t.glow}04 0%, hsl(var(--glass) / 0.7) 100%)` }}
              >
                <Quote className={`w-7 h-7 mb-4 ${t.color} opacity-40`} />
                <p className="text-sm text-foreground/85 leading-relaxed mb-5 italic">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-4 border-t border-border/40">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ${t.color}`}
                    style={{ background: `${t.glow}18`, border: `1px solid ${t.glow}30` }}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-foreground">{t.role}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{t.sector} · {t.size}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust strip */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="p-5 rounded-2xl border border-primary/20 bg-primary/5 text-center"
          >
            <p className="text-sm text-foreground font-semibold">
              🔒 Accès prioritaire · Places limitées · Déploiement en moins de 15 minutes
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Chaque témoignage a été collecté avec accord explicite de publication. Les données de performance sont issues de mesures réelles en environnement de production.
            </p>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
