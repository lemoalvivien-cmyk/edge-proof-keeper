import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { Play, Eye, Brain, CheckCircle2, Lock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const demoSteps = [
  {
    time: "0s",
    agent: "Scout Agent",
    icon: Eye,
    action: "Détecte port:8443 exposé sur votre infrastructure",
    color: "text-primary",
    glow: "hsl(185 100% 52%)",
    badge: "DÉTECTION",
    badgeColor: "label-badge-cyan",
  },
  {
    time: "12s",
    agent: "Analyst Agent",
    icon: Brain,
    action: "Génère plan de remédiation priorisé + impact business",
    color: "text-accent",
    glow: "hsl(258 90% 66%)",
    badge: "ANALYSE IA",
    badgeColor: "label-badge-purple",
  },
  {
    time: "23s",
    agent: "DSI Dashboard",
    icon: CheckCircle2,
    action: "Go/No-Go validé en 1 clic — ou mode fully autonomous",
    color: "text-success",
    glow: "hsl(158 80% 46%)",
    badge: "VALIDATION",
    badgeColor: "label-badge-green",
  },
  {
    time: "35s",
    agent: "Executor Agent",
    icon: Play,
    action: "Port fermé automatiquement via playbook souverain",
    color: "text-warning",
    glow: "hsl(42 96% 54%)",
    badge: "REMÉDIATION",
    badgeColor: "label-badge-red",
  },
  {
    time: "47s",
    agent: "Vault Agent",
    icon: Lock,
    action: "Preuve cryptographique signée dans l'Evidence Vault post-quantique",
    color: "text-primary",
    glow: "hsl(185 100% 52%)",
    badge: "PREUVE ✓",
    badgeColor: "label-badge-cyan",
  },
];

export function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const navigate = useNavigate();

  return (
    <section ref={ref} id="how-it-works" className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-50" />

      <div className="container relative px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-16 space-y-4"
          >
            <div className="label-badge label-badge-cyan mx-auto w-fit">
              <Play className="w-3 h-3 fill-current" />
              Démo en 47 secondes
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              De la détection à la preuve{" "}
              <span className="text-gradient">en 47 secondes</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Regardez les 5 agents opérer en swarm autonome. Zéro intervention humaine. Zéro jargon.
            </p>
          </motion.div>

          {/* Video embed placeholder + step timeline */}
          <div className="grid lg:grid-cols-2 gap-8 items-start">

            {/* Left: demo video card */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="relative group"
            >
              <div className="relative rounded-2xl overflow-hidden glass-card border border-border hover:border-primary/30 transition-all duration-500 aspect-video flex items-center justify-center cursor-pointer"
                style={{ background: "linear-gradient(135deg, hsl(185 100% 52% / 0.05) 0%, hsl(var(--glass) / 0.8) 100%)" }}
                onClick={() => navigate('/demo')}
              >
                {/* Fake video preview with animated swarm */}
                <div className="absolute inset-0 grid-pattern opacity-30" />

                {/* Animated agent nodes */}
                {demoSteps.map((step, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      x: [0, Math.cos(i * 72 * Math.PI / 180) * 40, 0],
                      y: [0, Math.sin(i * 72 * Math.PI / 180) * 30, 0],
                    }}
                    transition={{ duration: 3 + i, repeat: Infinity, ease: "easeInOut", delay: i * 0.5 }}
                    className="absolute"
                    style={{
                      left: `${20 + i * 15}%`,
                      top: `${25 + (i % 2) * 30}%`,
                    }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ background: `${step.glow}20`, border: `1px solid ${step.glow}40` }}>
                      <step.icon className={`w-4 h-4 ${step.color}`} />
                    </div>
                  </motion.div>
                ))}

                {/* Play button */}
                <div className="relative z-10 flex flex-col items-center gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.08, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="w-16 h-16 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center neon-glow group-hover:bg-primary/30 transition-colors"
                  >
                    <Play className="w-7 h-7 text-primary fill-current ml-1" />
                  </motion.div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-foreground">Voir la démo agents en live</p>
                    <p className="text-xs text-muted-foreground font-mono">Durée : 47 secondes</p>
                  </div>
                </div>

                {/* Timer badge */}
                <div className="absolute top-3 right-3 label-badge label-badge-cyan text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse inline-block" />
                  LIVE DEMO
                </div>
              </div>

              <Button
                size="lg"
                className="w-full mt-3 neon-glow font-bold gap-2 group hover:scale-[1.02] transition-transform"
                onClick={() => navigate('/demo')}
              >
                <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                Lancer la démo interactive
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </motion.div>

            {/* Right: step-by-step timeline */}
            <div className="space-y-3">
              {demoSteps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 30 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.1 + index * 0.1, ease: "easeOut" }}
                  onMouseEnter={() => setHoveredStep(index)}
                  onMouseLeave={() => setHoveredStep(null)}
                  className={`relative group flex items-start gap-4 p-4 rounded-xl border transition-all duration-300 cursor-default ${
                    hoveredStep === index
                      ? "glass-card border-primary/30"
                      : "border-border/50 hover:border-border"
                  }`}
                  style={hoveredStep === index ? { background: `linear-gradient(135deg, ${step.glow}08 0%, hsl(var(--glass) / 0.5) 100%)` } : {}}
                >
                  {/* Time badge */}
                  <div className="flex-shrink-0 w-10 text-center">
                    <span className="font-mono text-xs text-muted-foreground/60">{step.time}</span>
                    {index < demoSteps.length - 1 && (
                      <div className="w-px h-6 bg-border/50 mx-auto mt-1" />
                    )}
                  </div>

                  {/* Icon */}
                  <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-transform duration-300 ${hoveredStep === index ? "scale-110" : ""}`}
                    style={{ background: `${step.glow}18`, border: `1px solid ${step.glow}30` }}>
                    <step.icon className={`w-4 h-4 ${step.color}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-foreground/70">{step.agent}</span>
                      <span className={`label-badge ${step.badgeColor} text-[9px] py-0.5`}>{step.badge}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.action}</p>
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
