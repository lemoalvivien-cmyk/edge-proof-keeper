import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Quote, Building2, Users, ShieldCheck, Star } from "lucide-react";

const stats = [
  { icon: Building2, value: "500+", label: "Entreprises protégées", color: "text-primary" },
  { icon: ShieldCheck, value: "99.8%", label: "Taux de conformité atteint", color: "text-success" },
  { icon: Users, value: "10min", label: "Pour votre premier rapport", color: "text-accent" },
];

const testimonials = [
  {
    quote: "Enfin un outil qui me parle en langage business et pas en CVE-2024-XXXX. Mon DAF a compris les risques en 5 minutes.",
    author: "Marie D.",
    role: "CEO, TechStartup SAS",
    avatar: "MD",
    stars: 5,
  },
  {
    quote: "L'Evidence Vault m'a sauvé lors de notre dernier audit. Toutes les preuves étaient là, horodatées et hashées.",
    author: "Thomas B.",
    role: "DSI, IndustriePME",
    avatar: "TB",
    stars: 5,
  },
  {
    quote: "Notre assureur demandait des preuves de maturité cyber. SENTINEL EDGE nous a permis de les fournir en 24h.",
    author: "Sophie L.",
    role: "DAF, Commerce SARL",
    avatar: "SL",
    stars: 5,
  },
];

const logos = ["TechCorp", "InnovateSAS", "SecurePME", "DataFirst", "CloudFrance", "CyberSafe"];

export function SocialProofSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section ref={ref} className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/20 to-transparent" />

      <div className="container relative px-4">
        <div className="max-w-6xl mx-auto space-y-20">

          {/* Logos row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60 mb-8">
              Ils nous font confiance
            </p>
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10">
              {logos.map((logo, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 8 }}
                  animate={isInView ? { opacity: 0.4, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: index * 0.06 }}
                  whileHover={{ opacity: 0.8 }}
                  className="font-mono text-sm font-semibold text-muted-foreground tracking-wider cursor-default transition-all"
                >
                  {logo}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Stat cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1, ease: "easeOut" }}
                className="group relative p-6 rounded-2xl glass-card border border-border hover:border-primary/20 text-center transition-all duration-300 card-3d"
              >
                <div className={`w-12 h-12 mx-auto mb-4 rounded-xl bg-secondary/50 flex items-center justify-center ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon className="w-5 h-5" />
                </div>
                <div className={`text-4xl font-bold font-mono stat-number mb-1`}>{stat.value}</div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center"
            >
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Ce qu'en disent nos clients
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-5">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 36 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.4 + index * 0.12, ease: "easeOut" }}
                  className="relative p-6 rounded-2xl glass-card border border-border hover:border-primary/20 transition-all duration-300 card-3d group"
                >
                  {/* Stars */}
                  <div className="flex gap-0.5 mb-4">
                    {Array.from({ length: testimonial.stars }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-warning text-warning" />
                    ))}
                  </div>

                  <Quote className="w-7 h-7 text-primary/20 mb-3" />
                  <p className="text-foreground/80 mb-6 leading-relaxed text-sm">
                    "{testimonial.quote}"
                  </p>

                  <div className="flex items-center gap-3 pt-4 border-t border-border/60">
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
