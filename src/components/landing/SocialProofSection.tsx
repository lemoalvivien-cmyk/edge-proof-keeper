import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Quote, Building2, Users, ShieldCheck, Star, CheckCircle2, Cpu } from "lucide-react";

const stats = [
  { icon: Building2, value: "500+", label: "Entreprises protégées", color: "text-primary" },
  { icon: ShieldCheck, value: "99.9%", label: "Taux de conformité atteint", color: "text-success" },
  { icon: CheckCircle2, value: "47s", label: "Cycle détection → preuve", color: "text-accent" },
  { icon: Users, value: "0", label: "Équipe cyber requise", color: "text-warning" },
];

const testimonials = [
  {
    quote: "En 47 secondes, Scout a détecté un port exposé, Executor l'a fermé, et la preuve était dans le Vault. Notre assureur a été bluffé.",
    author: "Laurent M.",
    role: "DSI, Groupe Industriel (800 pers.)",
    avatar: "LM",
    stars: 5,
    badge: "DSI",
  },
  {
    quote: "Notre audit NIS2 s'est passé en 20 minutes. Tout était là : preuves horodatées, proof packs, trail complet. Les agents ont fait le travail en amont.",
    author: "Sophie K.",
    role: "DPO, Cabinet Comptable",
    avatar: "SK",
    stars: 5,
    badge: "DPO",
  },
  {
    quote: "On a réduit notre prime d'assurance cyber de 40% grâce aux Proof Packs. Le RSSI Virtuel IA nous envoie un brief CODIR chaque mois. Inestimable.",
    author: "Marc D.",
    role: "PDG, SaaS B2B Series A",
    avatar: "MD",
    stars: 5,
    badge: "CEO",
  },
];

const logos = ["Groupe AZUR", "DataFirst SAS", "CloudFrance", "SecurePME", "InnovateTech", "CyberSafe FR", "TechCorp EU", "DigitalProof"];

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
              Preuve sociale
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              500+ entreprises{" "}
              <span className="text-gradient">already immune</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              99.9% de conformité atteinte. Zéro équipe cyber requise. Témoignages réels.
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
                <div className={`text-3xl font-bold font-mono mb-1 ${stat.color}`}>{stat.value}</div>
                <p className="text-xs text-muted-foreground leading-snug">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Logos row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50 mb-8">
              Ils nous font confiance
            </p>
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
              {logos.map((logo, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={isInView ? { opacity: 0.35, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ opacity: 0.75 }}
                  className="font-mono text-xs font-semibold text-muted-foreground tracking-wider cursor-default transition-all"
                >
                  {logo}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Testimonials */}
          <div className="space-y-8">
            <div className="grid md:grid-cols-3 gap-5">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 36 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.12, ease: "easeOut" }}
                  className="relative p-6 rounded-2xl glass-card border border-border hover:border-primary/20 transition-all duration-300 card-3d group"
                >
                  {/* Stars */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex gap-0.5">
                      {Array.from({ length: testimonial.stars }).map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-warning text-warning" />
                      ))}
                    </div>
                    <span className="label-badge label-badge-cyan text-[9px] py-0.5">{testimonial.badge}</span>
                  </div>

                  <Quote className="w-6 h-6 text-primary/15 mb-3" />
                  <p className="text-foreground/75 mb-5 leading-relaxed text-sm">"{testimonial.quote}"</p>

                  <div className="flex items-center gap-3 pt-4 border-t border-border/50">
                    <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xs">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{testimonial.author}</p>
                      <p className="text-xs text-muted-foreground">{testimonial.role}</p>
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
