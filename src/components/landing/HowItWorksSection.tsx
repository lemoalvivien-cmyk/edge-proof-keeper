import { motion, useInView, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Play, Eye, Brain, CheckCircle2, Lock, ArrowRight, Zap, Shield, ChevronRight, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const STEPS = [
  {
    time: "0s",
    agent: "Scout Agent",
    icon: Eye,
    action: "Détecte port:8443 exposé sur votre infrastructure",
    detail: "Reconnaissance EASM passive — Shodan, Censys, BGP routing. Signal créé avec CVE-2025-1337, CVSS 9.1. Aucune sonde intrusive.",
    color: "text-primary",
    glow: "hsl(185 100% 52%)",
    glowAlpha: "hsl(185 100% 52% / 0.15)",
    badge: "DÉTECTION",
    badgeColor: "label-badge-cyan",
    impact: "Port 8443 exposé publiquement",
  },
  {
    time: "12s",
    agent: "Analyst Agent",
    icon: Brain,
    action: "Génère plan de remédiation priorisé + impact business",
    detail: "LLM souverain analyse le contexte, estime l'impact RGPD/NIS2, génère 3 scénarios de remédiation par criticité. Brief DSI automatique.",
    color: "text-accent",
    glow: "hsl(258 90% 66%)",
    glowAlpha: "hsl(258 90% 66% / 0.15)",
    badge: "ANALYSE IA",
    badgeColor: "label-badge-purple",
    impact: "ROI remédiation : 34× vs exploit",
  },
  {
    time: "23s",
    agent: "DSI Dashboard",
    icon: CheckCircle2,
    action: "Go/No-Go validé en 1 clic — ou délégation supervisée au Swarm",
    detail: "Interface 1-clic : le dirigeant valide ou délègue. Mode autonome disponible pour les patterns répétitifs. Audit trail instantané.",
    color: "text-success",
    glow: "hsl(158 80% 46%)",
    glowAlpha: "hsl(158 80% 46% / 0.15)",
    badge: "VALIDATION",
    badgeColor: "label-badge-green",
    impact: "Décision en < 30 secondes",
  },
  {
    time: "35s",
    agent: "Executor Agent",
    icon: Zap,
    action: "Port fermé automatiquement via playbook souverain",
    detail: "Playbook exécuté : AWS SG revoke + firewall update + rollback snapshot. Pre-state sauvegardé. QA automatique post-remédiation.",
    color: "text-warning",
    glow: "hsl(42 96% 54%)",
    glowAlpha: "hsl(42 96% 54% / 0.15)",
    badge: "REMÉDIATION",
    badgeColor: "label-badge-red",
    impact: "Port 8443 : fermé en 2,3s",
  },
  {
    time: "47s",
    agent: "Vault Agent",
    icon: Lock,
    action: "Preuve cryptographique signée dans l'Evidence Vault",
    detail: "Signature post-quantique CRYSTALS-Dilithium3. Chaîne de hashes SHA-256 immuable. Preuve exportable PDF/JSON pour audit NIS2/CNIL.",
    color: "text-primary",
    glow: "hsl(185 100% 52%)",
    glowAlpha: "hsl(185 100% 52% / 0.15)",
    badge: "PREUVE ✓",
    badgeColor: "label-badge-cyan",
    impact: "Evidence NIS2 : certifiée",
  },
];

function AutoPlayTimeline({ isInView }: { isInView: boolean }) {
  const [active, setActive] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isInView && active === -1) {
      // Auto-start after 600ms
      const t = setTimeout(() => {
        setPlaying(true);
        setActive(0);
      }, 600);
      return () => clearTimeout(t);
    }
  }, [isInView]);

  useEffect(() => {
    if (!playing) return;
    if (active >= STEPS.length) {
      setPlaying(false);
      return;
    }
    timerRef.current = setTimeout(() => {
      setActive(a => a + 1);
    }, 1800);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [active, playing]);

  const restart = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActive(0);
    setPlaying(true);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
          SWARM AUTONOME — {active >= STEPS.length ? '✓ CYCLE COMPLET' : `T+${STEPS[Math.min(active, STEPS.length - 1)]?.time ?? '0s'}`}
        </span>
        {active >= STEPS.length && (
          <button
            onClick={restart}
            className="flex items-center gap-1 text-[10px] font-mono text-primary hover:text-primary/80 transition-colors"
          >
            <Play className="w-3 h-3 fill-current" /> Rejouer
          </button>
        )}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-muted/60 rounded-full h-1.5 mb-4 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--success)))" }}
          animate={{ width: `${Math.min((active / STEPS.length) * 100, 100)}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>

      <div className="relative space-y-2">
        <div className="absolute left-[17px] top-5 bottom-5 w-px bg-border/40" />
        {STEPS.map((step, i) => {
          const Icon = step.icon;
          const isDone = i < active;
          const isCurrent = i === active - 1;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0.2 }}
              animate={{ opacity: i < active ? 1 : 0.3 }}
              transition={{ duration: 0.4 }}
              className="flex items-start gap-3 relative"
            >
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-500 z-10 ${
                isDone
                  ? 'bg-success/15 border-success/50'
                  : 'bg-muted/50 border-border/40'
              }`}>
                {isDone
                  ? <CheckCircle2 className="w-4 h-4 text-success" />
                  : <Icon className={`w-3.5 h-3.5 ${isDone ? step.color : 'text-muted-foreground/30'}`} />
                }
              </div>
              <div className={`flex-1 p-3 rounded-xl border transition-all duration-500 ${
                isCurrent
                  ? 'border-primary/30 shadow-sm'
                  : isDone ? 'border-success/15 bg-success/3' : 'border-border/20 bg-transparent'
              }`}
                style={isCurrent ? { background: step.glowAlpha } : {}}
              >
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] font-mono font-bold transition-colors ${isDone || isCurrent ? 'text-foreground/70' : 'text-muted-foreground/30'}`}>
                    {step.agent}
                  </span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded transition-all ${isDone ? 'bg-success/15 text-success' : 'bg-muted/50 text-muted-foreground/30'}`}>
                    T+{step.time}
                  </span>
                </div>
                <p className={`text-xs transition-colors duration-500 ${isDone || isCurrent ? 'text-muted-foreground' : 'text-muted-foreground/25'}`}>
                  {step.action}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {active > STEPS.length - 1 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 p-3 rounded-xl border border-success/30 bg-success/8 flex items-center gap-3"
        >
          <Shield className="w-5 h-5 text-success flex-shrink-0" />
          <div>
            <p className="text-xs font-bold text-success">Cycle complet — 47 secondes</p>
            <p className="text-[10px] text-muted-foreground font-mono">Preuve NIS2 exportable · Zéro intervention humaine</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export function HowItWorksSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.12 });
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const navigate = useNavigate();

  return (
    <section ref={ref} id="how-it-works" className="relative py-28 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/30 to-transparent" />

      <div className="container relative px-4">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center mb-16 space-y-4"
          >
            <div className="label-badge label-badge-cyan mx-auto w-fit">
              <Activity className="w-3 h-3" />
              Séquence autonome en temps réel
            </div>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
              De la détection à la preuve{" "}
              <span className="text-gradient">en 47 secondes</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              6 agents opèrent en swarm autonome. Aucun jargon, aucune intervention, aucun vide.{" "}
              <span className="text-foreground font-medium">Juste du résultat mesurable.</span>
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">

            {/* LEFT: Interactive step detail */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="space-y-4"
            >
              {/* Step cards with full detail */}
              <div className="space-y-2">
                {STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isHovered = hoveredStep === index;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.5, delay: 0.1 + index * 0.08 }}
                      onMouseEnter={() => setHoveredStep(index)}
                      onMouseLeave={() => setHoveredStep(null)}
                      className={`group relative flex gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                        isHovered
                          ? "border-primary/30 shadow-lg"
                          : "border-border/40 hover:border-border/60"
                      }`}
                      style={isHovered ? { background: step.glowAlpha } : {}}
                    >
                      {/* Time + connector */}
                      <div className="flex flex-col items-center gap-1 flex-shrink-0 w-10">
                        <span className="font-mono text-xs font-bold" style={{ color: isHovered ? step.glow : undefined }}>
                          {step.time}
                        </span>
                        {index < STEPS.length - 1 && (
                          <div className="flex-1 w-px bg-border/40 group-hover:bg-primary/20 transition-colors min-h-[20px]" />
                        )}
                      </div>

                      {/* Icon */}
                      <div
                        className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${isHovered ? "scale-110" : ""}`}
                        style={{ background: step.glowAlpha, border: `1px solid ${step.glow}35` }}
                      >
                        <Icon className={`w-5 h-5 ${step.color}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-sm font-bold text-foreground">{step.agent}</span>
                          <span className={`label-badge ${step.badgeColor} text-[9px] py-0.5`}>{step.badge}</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">{step.action}</p>

                        {/* Expanded detail on hover */}
                        <AnimatePresence>
                          {isHovered && (
                            <motion.div
                              initial={{ opacity: 0, height: 0, marginTop: 0 }}
                              animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                              exit={{ opacity: 0, height: 0, marginTop: 0 }}
                              transition={{ duration: 0.25 }}
                            >
                              <div className="space-y-2">
                                <p className="text-xs text-muted-foreground/80 leading-relaxed border-l-2 pl-2.5 border-primary/30 italic">
                                  {step.detail}
                                </p>
                                <div className="flex items-center gap-1.5 text-[10px] font-mono">
                                  <ChevronRight className="w-3 h-3 text-success flex-shrink-0" />
                                  <span className="text-success font-semibold">{step.impact}</span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : {}}
                transition={{ delay: 0.8 }}
                className="pt-2"
              >
                <Button
                  size="lg"
                  className="w-full neon-glow font-bold gap-2 group hover:scale-[1.02] transition-transform"
                  onClick={() => navigate('/demo')}
                >
                  <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                  Tester la démo interactive complète
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-2 font-mono">
                  Données démo réalistes · Preuves SHA-256 réelles · Aucune installation
                </p>
              </motion.div>
            </motion.div>

            {/* RIGHT: Auto-playing cockpit */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={isInView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
              className="sticky top-24"
            >
              <div className="relative rounded-2xl overflow-hidden glass-card-premium border border-primary/20">
                {/* Window header */}
                <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-secondary/20">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-destructive/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-warning/50" />
                    <div className="w-2.5 h-2.5 rounded-full bg-success/50" />
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground mx-3">securit-e.com — Swarm Intelligence</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    <span className="text-[9px] font-mono text-success">AUTONOMOUS · 6/6</span>
                  </div>
                </div>

                <div className="p-5">
                  {/* Top KPIs */}
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {[
                      { label: "Score", value: "87/100", color: "text-success" },
                      { label: "Findings", value: "9 open", color: "text-warning" },
                      { label: "Vault", value: "2 841", color: "text-primary" },
                    ].map((kpi, i) => (
                      <div key={i} className="text-center p-2.5 rounded-xl bg-muted/20 border border-border/40">
                        <div className={`text-lg font-bold font-mono ${kpi.color}`}>{kpi.value}</div>
                        <div className="text-[9px] text-muted-foreground mt-0.5">{kpi.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Auto-playing timeline */}
                  <AutoPlayTimeline isInView={isInView} />
                </div>

                {/* Bottom trust strip */}
                <div className="px-5 py-3 border-t border-border/40 bg-secondary/10 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-success" /> NIS2
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" /> RGPD
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" /> ISO 27001
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground/60">🇫🇷 100% Souverain</span>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </section>
  );
}
