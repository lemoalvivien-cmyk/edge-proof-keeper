import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Quote, Building2, Users, ShieldCheck } from "lucide-react";

const stats = [
  {
    icon: Building2,
    value: "500+",
    label: "Entreprises protégées",
  },
  {
    icon: ShieldCheck,
    value: "99.8%",
    label: "Taux de conformité atteint",
  },
  {
    icon: Users,
    value: "10min",
    label: "Pour votre premier rapport",
  },
];

const testimonials = [
  {
    quote: "Enfin un outil qui me parle en langage business et pas en CVE-2024-XXXX. Mon DAF a compris les risques en 5 minutes.",
    author: "Marie D.",
    role: "CEO, TechStartup SAS",
    avatar: "MD",
  },
  {
    quote: "L'Evidence Vault m'a sauvé lors de notre dernier audit. Toutes les preuves étaient là, horodatées et hashées.",
    author: "Thomas B.",
    role: "DSI, IndustriePME",
    avatar: "TB",
  },
  {
    quote: "Notre assureur nous a demandé des preuves de maturité cyber. SENTINEL EDGE nous a permis de les fournir en 24h.",
    author: "Sophie L.",
    role: "DAF, Commerce SARL",
    avatar: "SL",
  },
];

const logos = [
  "TechCorp",
  "InnovateSAS",
  "SecurePME",
  "DataFirst",
  "CloudFrance",
  "CyberSafe",
];

export function SocialProofSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className="relative py-24 overflow-hidden bg-secondary/20">
      <div className="container px-4">
        <div className="max-w-5xl mx-auto space-y-16">
          {/* Logos */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <p className="text-sm text-muted-foreground mb-8">
              Ils nous font confiance
            </p>
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
              {logos.map((logo, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={isInView ? { opacity: 0.5, y: 0 } : {}}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="text-lg font-semibold text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                >
                  {logo}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Stats */}
          <div className="grid sm:grid-cols-3 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                className="text-center p-6 rounded-xl glass-card"
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-gradient mb-2">
                  {stat.value}
                </div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={isInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-center"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                Ce qu'en disent nos clients
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                  className="relative p-6 rounded-xl glass-card"
                >
                  <Quote className="w-8 h-8 text-primary/30 mb-4" />
                  <p className="text-foreground mb-6 leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">
                        {testimonial.author}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {testimonial.role}
                      </p>
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
