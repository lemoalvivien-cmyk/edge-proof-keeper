import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Cpu, Brain, Wrench, Lock, Eye, Sparkles } from "lucide-react";

const agents = [
  {
    id: "01",
    name: "Scout Agent",
    role: "Détection & Reconnaissance",
    description: "Surveille 24/7 votre surface d'attaque. Détecte ports ouverts, fuites, vulnérabilités avant les attaquants.",
    Icon: Eye,
    color: "text-primary",
    glow: "hsl(185 100% 52%)",
    badge: "EASM / OSINT",
    badgeColor: "label-badge-cyan",
  },
  {
    id: "02",
    name: "Analyst Agent",
    role: "Prédiction & Priorisation IA",
    description: "Analyse les signaux, corrèle les risques, génère un plan de remédiation priorisé en langage business.",
    Icon: Brain,
    color: "text-accent",
    glow: "hsl(258 90% 66%)",
    badge: "AI Powered",
    badgeColor: "label-badge-purple",
  },
  {
    id: "03",
    name: "Executor Agent",
    role: "Auto-remédiation souveraine",
    description: "Ferme les vulnérabilités automatiquement ou soumet la patch au DSI pour validation en 1 clic.",
    Icon: Wrench,
    color: "text-success",
    glow: "hsl(158 80% 46%)",
    badge: "Self-Healing",
    badgeColor: "label-badge-green",
  },
  {
    id: "04",
    name: "Vault Agent",
    role: "Evidence post-quantique",
    description: "Horodate, signe et enchaîne chaque preuve cryptographiquement. Opposable aux régulateurs, assureurs, juges.",
    Icon: Lock,
    color: "text-warning",
    glow: "hsl(42 96% 54%)",
    badge: "Post-Quantum",
    badgeColor: "label-badge-red",
  },
  {
    id: "05",
    name: "RSSI Virtuel IA",
    role: "Brief direction mensuel",
    description: "Génère votre brief exécutif mensuel : score de maturité, risques critiques, ROI cyber. Pour votre CODIR.",
    Icon: Cpu,
    color: "text-primary",
    glow: "hsl(185 100% 52%)",
    badge: "CISO AI",
    badgeColor: "label-badge-cyan",
  },
];

export function PromiseSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  const agentA = agents[0];
  const agentB = agents[1];
  const IconA = agentA.Icon;
  const IconB = agentB.Icon;

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
              style={{ background: "linear-gradient(135deg, hsl(185 100% 52% / 0.04) 0%, hsl(var(--glass) / 0.6) 100%)" }}
            >
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ background: "radial-gradient(circle, hsl(185 100% 52%) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />

              <div className="relative flex items-start gap-5">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                  style={{ background: "hsl(185 100% 52% / 0.12)", border: "1px solid hsl(185 100% 52% / 0.20)" }}>
                  <IconA className={`w-7 h-7 ${agentA.color}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs text-muted-foreground/50">{agentA.id}</span>
                    <span className={`label-badge ${agentA.badgeColor} text-[10px]`}>{agentA.badge}</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-0.5">{agentA.name}</h3>
                  <p className={`text-sm font-semibold mb-3 ${agentA.color}`}>{agentA.role}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{agentA.description}</p>
                </div>
              </div>
            </motion.div>

            {/* Agent 02 */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
              className="group relative p-6 rounded-2xl glass-card border border-border hover:border-accent/30 transition-all duration-500 overflow-hidden"
              style={{ background: "linear-gradient(135deg, hsl(258 90% 66% / 0.04) 0%, hsl(var(--glass) / 0.6) 100%)" }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                style={{ background: "hsl(258 90% 66% / 0.12)", border: "1px solid hsl(258 90% 66% / 0.20)" }}>
                <IconB className={`w-6 h-6 ${agentB.color}`} />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs text-muted-foreground/50">{agentB.id}</span>
                <span className={`label-badge ${agentB.badgeColor} text-[10px]`}>{agentB.badge}</span>
              </div>
              <h3 className="text-base font-bold text-foreground mb-0.5">{agentB.name}</h3>
              <p className={`text-xs font-semibold mb-2 ${agentB.color}`}>{agentB.role}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{agentB.description}</p>
            </motion.div>

            {/* Agent 03, 04, 05 — bottom row */}
            {agents.slice(2).map((agent, i) => {
              const AgentIcon = agent.Icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.1, ease: "easeOut" }}
                  className="group relative p-6 rounded-2xl glass-card border border-border hover:border-primary/20 transition-all duration-500 overflow-hidden"
                  style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.03) 0%, hsl(var(--glass) / 0.6) 100%)" }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    style={{ background: "hsl(var(--primary) / 0.10)", border: "1px solid hsl(var(--primary) / 0.15)" }}>
                    <AgentIcon className={`w-5 h-5 ${agent.color}`} />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs text-muted-foreground/50">{agent.id}</span>
                    <span className={`label-badge ${agent.badgeColor} text-[9px] py-0.5`}>{agent.badge}</span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-0.5">{agent.name}</h3>
                  <p className={`text-xs font-semibold mb-2 ${agent.color}`}>{agent.role}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{agent.description}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Swarm stat banner */}
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
