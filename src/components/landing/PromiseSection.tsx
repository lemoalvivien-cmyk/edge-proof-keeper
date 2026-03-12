import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Shield, CheckCircle2, Eye, FileCheck, Zap, Sparkles } from "lucide-react";

const benefits = [
  { icon: Eye,       text: "Comprenez votre niveau de risque en 10 minutes" },
  { icon: FileCheck, text: "Générez des preuves opposables aux régulateurs" },
  { icon: Shield,    text: "Pilotez conformité RGPD & NIS2 sans jargon technique" },
  { icon: Zap,       text: "Obtenez un plan d'action clair, priorisé, actable" },
];

export function PromiseSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.25 });

  return (
    <section ref={ref} className="relative py-28 overflow-hidden">
      {/* Subtle bg */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/3 to-transparent" />

      <div className="container relative px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left: Orbital visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.88 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative order-2 lg:order-1 flex items-center justify-center"
            >
              <div className="relative w-72 h-72">
                {/* Rings */}
                <div className="absolute inset-0 rounded-full border border-primary/10" />
                <div className="absolute inset-8 rounded-full border border-accent/10" />
                <div className="absolute inset-16 rounded-full border border-primary/20 animate-[spin_25s_linear_infinite]" />

                {/* Glow center */}
                <div className="absolute inset-20 rounded-full"
                  style={{ background: "radial-gradient(circle, hsl(185 100% 52% / 0.2) 0%, transparent 70%)" }} />

                {/* Core */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center neon-glow pulse-glow">
                    <Shield className="w-12 h-12 text-primary" />
                  </div>
                </div>

                {/* Orbiting pills */}
                {[
                  { icon: Eye, color: "text-accent", label: "Visibilité", angle: -60 },
                  { icon: FileCheck, color: "text-success", label: "Preuves", angle: 120 },
                  { icon: Zap, color: "text-primary", label: "Actions", angle: 220 },
                ].map((item, i) => {
                  const rad = (item.angle * Math.PI) / 180;
                  const x = Math.cos(rad) * 110;
                  const y = Math.sin(rad) * 110;
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ delay: 0.3 + i * 0.15, duration: 0.5, type: "spring" }}
                      className="absolute"
                      style={{ left: "50%", top: "50%", transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                    >
                      <div className={`w-12 h-12 rounded-xl glass-card flex items-center justify-center float ${item.color}`}
                        style={{ animationDelay: `${-i * 2}s` }}>
                        <item.icon className="w-5 h-5" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Right: Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="space-y-8 order-1 lg:order-2"
            >
              <div className="space-y-4">
                <div className="label-badge label-badge-green w-fit">
                  <Sparkles className="w-3 h-3" />
                  La solution
                </div>
                <h2 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                  <span className="text-gradient">SENTINEL EDGE</span>
                  <br />
                  <span className="text-foreground">votre bouclier souverain</span>
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Une plateforme tout-en-un qui traduit la complexité cyber en{" "}
                  <span className="text-foreground font-semibold">actions simples</span> et{" "}
                  <span className="text-foreground font-semibold">preuves béton</span>.
                </p>
              </div>

              <div className="space-y-2">
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 24 }}
                    animate={isInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                    className="group flex items-center gap-3 p-3 rounded-xl hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-all duration-300"
                  >
                    <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    </div>
                    <span className="text-foreground/85 group-hover:text-foreground transition-colors text-sm font-medium">
                      {benefit.text}
                    </span>
                  </motion.div>
                ))}
              </div>

              {/* Price anchor */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="flex items-center gap-5 p-5 rounded-2xl border border-primary/20 glass-card-premium"
              >
                <div>
                  <span className="text-4xl font-bold font-mono text-gradient neon-text">490€</span>
                  <span className="text-muted-foreground text-sm ml-2">TTC / an</span>
                </div>
                <div className="w-px h-10 bg-border" />
                <div className="text-sm text-muted-foreground">
                  Tout inclus · Sans surprise<br />
                  <span className="text-foreground font-medium">Pro 4 900€ · Enterprise 24 900€</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
