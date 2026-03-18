import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Cpu, Brain, Wrench, Lock, Eye, Sparkles, Network, ShieldCheck, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const agents = [
  {
    id: "01",
    name: "Scout Agent",
    role: "Surveillance continue · OSINT · EASM",
    description: "Scanne 24/7 votre surface d'attaque externe. Ports exposés, fuites de credentials, CVE actifs — détectés avant les attaquants.",
    metric: "847 endpoints surveillés",
    Icon: Eye,
    color: "text-primary",
    glow: "hsl(185 100% 52%)",
    badge: "EASM / OSINT",
    badgeColor: "label-badge-cyan",
  },
  {
    id: "02",
    name: "Analyst Agent",
    role: "Analyse prédictive de risques",
    description: "Corrèle les signaux, calcule les probabilités de risque, génère un plan de remédiation priorisé en langage business — pas en jargon technique.",
    metric: "Priorisation basée sur le risque réel",
    Icon: Brain,
    color: "text-accent",
    glow: "hsl(258 90% 66%)",
    badge: "Predictive AI",
    badgeColor: "label-badge-purple",
  },
  {
    id: "03",
    name: "Executor Agent",
    role: "Self-healing autonome · SLA < 4h",
    description: "Ferme les vulnérabilités automatiquement via playbooks souverains, ou soumet au DSI pour validation Go/No-Go en 1 clic.",
    metric: "SLA remédiation < 4h",
    Icon: Wrench,
    color: "text-success",
    glow: "hsl(158 80% 46%)",
    badge: "Self-Healing",
    badgeColor: "label-badge-green",
  },
  {
    id: "04",
    name: "Verifier Agent",
    role: "Validation & rollback automatique",
    description: "Vérifie chaque remédiation. Rollback immédiat si anomalie détectée. Garantit l'intégrité de votre infrastructure après chaque intervention.",
    metric: "0 régression non détectée",
    Icon: ShieldCheck,
    color: "text-warning",
    glow: "hsl(42 96% 54%)",
    badge: "QA Auto",
    badgeColor: "label-badge-red",
  },
  {
    id: "05",
    name: "Vault Agent",
    role: "Preuves post-quantiques immuables",
    description: "Horodate et signe chaque preuve avec CRYSTALS-Dilithium. Opposable aux régulateurs NIS2, assureurs, et tribunaux. Pour toujours.",
    metric: "2 841+ preuves archivées",
    Icon: Lock,
    color: "text-primary",
    glow: "hsl(185 100% 52%)",
    badge: "Post-Quantum",
    badgeColor: "label-badge-cyan",
  },
  {
    id: "06",
    name: "RSSI Virtuel IA",
    role: "Brief CODIR mensuel automatique",
    description: "Score de maturité, risques critiques, ROI cyber, recommandations stratégiques — livré directement à votre CODIR en langage décision.",
    metric: "Brief prêt en < 2 min",
    Icon: Cpu,
    color: "text-accent",
    glow: "hsl(258 90% 66%)",
    badge: "CISO AI",
    badgeColor: "label-badge-purple",
  },
];

export function PromiseSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.08 });
  const navigate = useNavigate();

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
              Votre RSSI interne coûte <span className="text-destructive">120 000€/an</span>.
              <br />
              <span className="text-gradient">6 agents IA autonomes : 490€.</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Chaque agent opère 24/7 en autonomie totale. Ensemble, ils forment le premier système immunitaire cyber souverain conçu pour les dirigeants, pas pour les techniciens.
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
              style={{ background: "linear-gradient(135deg, hsl(185 100% 52% / 0.05) 0%, hsl(var(--glass) / 0.6) 100%)" }}
            >
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none opacity-10 group-hover:opacity-20 transition-opacity"
                style={{ background: "radial-gradient(circle, hsl(185 100% 52%) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />
              <div className="relative flex items-start gap-5">
                <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
                  style={{ background: "hsl(185 100% 52% / 0.12)", border: "1px solid hsl(185 100% 52% / 0.22)" }}>
                  <Eye className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="font-mono text-xs text-muted-foreground/50">{agents[0].id}</span>
                    <span className={`label-badge ${agents[0].badgeColor} text-[10px]`}>{agents[0].badge}</span>
                    <span className="text-[10px] font-mono text-success bg-success/10 px-2 py-0.5 rounded-full">{agents[0].metric}</span>
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-0.5">{agents[0].name}</h3>
                  <p className={`text-sm font-semibold mb-3 text-primary`}>{agents[0].role}</p>
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
              style={{ background: "linear-gradient(135deg, hsl(258 90% 66% / 0.05) 0%, hsl(var(--glass) / 0.6) 100%)" }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                style={{ background: "hsl(258 90% 66% / 0.12)", border: "1px solid hsl(258 90% 66% / 0.22)" }}>
                <Brain className="w-6 h-6 text-accent" />
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs text-muted-foreground/50">{agents[1].id}</span>
                <span className={`label-badge ${agents[1].badgeColor} text-[10px]`}>{agents[1].badge}</span>
              </div>
              <h3 className="text-base font-bold text-foreground mb-0.5">{agents[1].name}</h3>
              <p className="text-xs font-semibold mb-2 text-accent">{agents[1].role}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{agents[1].description}</p>
              <div className="mt-3 text-[10px] font-mono text-success bg-success/10 px-2 py-1 rounded-lg inline-block">{agents[1].metric}</div>
            </motion.div>

            {/* Agents 03-06 */}
            {agents.slice(2).map((agent, i) => {
              const AgentIcon = agent.Icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  animate={isInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.6, delay: 0.2 + i * 0.08, ease: "easeOut" }}
                  className="group relative p-5 rounded-2xl glass-card border border-border hover:border-primary/20 transition-all duration-500 overflow-hidden"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                    style={{ background: `${agent.glow}12`, border: `1px solid ${agent.glow}22` }}>
                    <AgentIcon className={`w-5 h-5 ${agent.color}`} />
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-mono text-xs text-muted-foreground/50">{agent.id}</span>
                    <span className={`label-badge ${agent.badgeColor} text-[9px] py-0.5`}>{agent.badge}</span>
                  </div>
                  <h3 className="text-sm font-bold text-foreground mb-0.5">{agent.name}</h3>
                  <p className={`text-xs font-semibold mb-2 ${agent.color}`}>{agent.role}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">{agent.description}</p>
                  <div className="mt-2 text-[10px] font-mono text-muted-foreground">{agent.metric}</div>
                </motion.div>
              );
            })}
          </div>

          {/* Value comparison banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="mt-10 p-6 rounded-2xl glass-card-premium border border-primary/15"
          >
            <div className="flex flex-col lg:flex-row items-center gap-6 justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Network className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">Swarm Intelligence · Predictive Causality Engine · Evidence Vault</p>
                  <p className="text-xs text-muted-foreground">6 agents collaborent anonymement — attaques prédites 90 jours à l'avance</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-center flex-wrap justify-center">
                {[
                  { v: "47s", l: "Cycle complet", c: "text-gradient" },
                  { v: "90j", l: "Prédiction attaque", c: "text-accent" },
                  { v: "× 367", l: "ROI estimé an 1", c: "text-success" },
                  { v: "0", l: "Équipe RSSI requise", c: "text-primary" },
                ].map((s, i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <div className={`text-2xl font-bold font-mono ${s.c}`}>{s.v}</div>
                    <div className="text-[10px] text-muted-foreground">{s.l}</div>
                    {i < 3 && <div className="hidden sm:block w-px h-8 bg-border ml-3 -mr-3" />}
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/auth?tab=signup')}
                className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold neon-glow hover:scale-[1.02] transition-transform"
              >
                Activer les 6 agents <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
