import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Cpu, Brain, Wrench, Lock, Eye, Sparkles } from "lucide-react";

const agents = [
  {
    id: "01",
    name: "Scout Agent",
    role: "Détection & Reconnaissance",
    description: "Surveille 24/7 votre surface d'attaque. Détecte ports ouverts, fuites, vulnérabilités avant les attaquants.",
    icon: Eye,
    color: "text-primary",
    glow: "hsl(185 100% 52%)",
    badge: "EASM / OSINT",
  },
  {
    id: "02",
    name: "Analyst Agent",
    role: "Prédiction & Priorisation IA",
    description: "Analyse les signaux, corrèle les risques, génère un plan de remédiation priorisé en langage business.",
    icon: Brain,
    color: "text-accent",
    glow: "hsl(258 90% 66%)",
    badge: "AI Powered",
  },
  {
    id: "03",
    name: "Executor Agent",
    role: "Auto-remédiation souveraine",
    description: "Ferme les vulnérabilités automatiquement ou soumet la patch au DSI pour validation en 1 clic.",
    icon: Wrench,
    color: "text-success",
    glow: "hsl(158 80% 46%)",
    badge: "Self-Healing",
  },
  {
    id: "04",
    name: "Vault Agent",
    role: "Evidence post-quantique",
    description: "Horodate, signe et enchaîne chaque preuve cryptographiquement. Opposable aux régulateurs, assureurs, juges.",
    icon: Lock,
    color: "text-warning",
    glow: "hsl(42 96% 54%)",
    badge: "Post-Quantum",
  },
  {
    id: "05",
    name: "RSSI Virtuel IA",
    role: "Brief direction mensuel",
    description: "Génère votre brief exécutif mensuel : score de maturité, risques critiques, ROI cyber. Pour votre CODIR.",
    icon: Cpu,
    color: "text-primary",
    glow: "hsl(185 100% 52%)",
    badge: "CISO AI",
  },
];

export function PromiseSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section ref={ref} className="relative py-28 overflow-hidden" id="agents">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/2 to-transparent" />
      <div className="absolute inset-0 grid-pattern-fine opacity-30" />

      <div className="container relative px-4">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-16 space-y-4"
          >
            <div className="label-badge label-badge-green mx-auto w-fit">
              <Sparkles className="w-3 h-3" />
              La Solution
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              5 Agents IA en{" "}
              <span className="text-gradient">Swarm autonome</span>
              <br />
              <span className="text-foreground">qui remplacent 3 experts</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Chaque agent opère 24/7 sans intervention humaine. Vous avez un dashboard, un brief, et des preuves. C'est tout.
            </p>
          </motion.div>

          {/* Agents bento grid */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Agent 01 — wide */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="md:col-span-2 group relative p-7 rounded-2xl glass-card border border-border hover:border-primary/30 transition-all duration-500 overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${agents[0].glow}0A 0%, hsl(var(--glass) / 0.6) 100%)` }}
            >
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ background: `radial-gradient(circle, ${agents[0].glow} 0%, transparent 70%)`, transform: "translate(30%, -30%)" }} />

              <div className="relative flex items-start gap-5">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                  style={{ background: `${agents[0].glow}18`, border: `1px solid ${agents[0].glow}30` }}>
                  <agents[0].icon className={`w-7 h-7 ${agents[0].color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs text-muted-foreground/50">{agents[0].id}</span>
                    <span className="label-badge label-badge-cyan text-[10px]">{agents[0].badge}</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-0.5">{agents[0].name}</h3>
                  <p className={`text-sm font-semibold mb-3 ${agents[0].color}`}>{agents[0].role}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{agents[0].description}</p>
                </div>
              </div>
            </motion.div>

            {/* Agent 02 */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
              className="group relative p-6 rounded-2xl glass-card border border-border hover:border-accent/30 transition-all duration-500 overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${agents[1].glow}0A 0%, hsl(var(--glass) / 0.6) 100%)` }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                style={{ background: `${agents[1].glow}18`, border: `1px solid ${agents[1].glow}30` }}>
                <agents[1].icon className={`w-6 h-6 ${agents[1].color}`} />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs text-muted-foreground/50">{agents[1].id}</span>
                <span className="label-badge label-badge-purple text-[10px]">{agents[1].badge}</span>
              </div>
              <h3 className="text-base font-bold text-foreground mb-0.5">{agents[1].name}</h3>
              <p className={`text-xs font-semibold mb-2 ${agents[1].color}`}>{agents[1].role}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{agents[1].description}</p>
            </motion.div>

            {/* Agent 03, 04, 05 — bottom row */}
            {agents.slice(2).map((agent, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.1, ease: "easeOut" }}
                className="group relative p-6 rounded-2xl glass-card border border-border hover:border-primary/20 transition-all duration-500 overflow-hidden"
                style={{ background: `linear-gradient(135deg, ${agent.glow}0A 0%, hsl(var(--glass) / 0.6) 100%)` }}
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                  style={{ background: `${agent.glow}18`, border: `1px solid ${agent.glow}30` }}>
                  <agent.icon className={`w-5 h-5 ${agent.color}`} />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-muted-foreground/50">{agent.id}</span>
                </div>
                <h3 className="text-sm font-bold text-foreground mb-0.5">{agent.name}</h3>
                <p className={`text-xs font-semibold mb-2 ${agent.color}`}>{agent.role}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{agent.description}</p>
              </motion.div>
            ))}
          </div>

          {/* Swarm visual stat */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-10 p-5 rounded-2xl glass-card-premium border border-primary/15 flex flex-col sm:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Cpu className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Swarm Autonomous Mode</p>
                <p className="text-xs text-muted-foreground">Les 5 agents collaborent sans intervention humaine</p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-center">
              <div>
                <div className="text-2xl font-bold font-mono text-gradient">47s</div>
                <div className="text-xs text-muted-foreground">Cycle complet détection → preuve</div>
              </div>
              <div className="w-px h-10 bg-border" />
              <div>
                <div className="text-2xl font-bold font-mono text-success">0</div>
                <div className="text-xs text-muted-foreground">Intervention humaine requise</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
