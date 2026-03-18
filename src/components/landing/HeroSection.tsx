import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Cpu, ArrowRight, CalendarDays, Lock, Zap, Play, Activity, CheckCircle2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoRequestDialog } from "@/components/ui/DemoRequestDialog";
import { trackEvent } from "@/lib/tracking";
import { usePublicCta } from "@/hooks/usePublicCta";

/* ── Neural network particle field ── */
function NeuralField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);

    const nodes: Array<{ x: number; y: number; vx: number; vy: number; r: number; a: number; da: number; pulse: number }> = [];
    for (let i = 0; i < 60; i++) {
      nodes.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 2 + 0.5,
        a: Math.random() * 0.6 + 0.1, da: (Math.random() - 0.5) * 0.003,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    let raf: number;
    let t = 0;
    const draw = () => {
      t += 0.008;
      ctx.clearRect(0, 0, W, H);

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const alpha = 0.06 * (1 - dist / 130);
            ctx.beginPath();
            ctx.strokeStyle = `hsla(185, 100%, 52%, ${alpha})`;
            ctx.lineWidth = 0.4;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      nodes.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        p.a += p.da; p.pulse += 0.02;
        if (p.a < 0.05) p.da = Math.abs(p.da);
        if (p.a > 0.7) p.da = -Math.abs(p.da);
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;

        const pulseR = p.r + Math.sin(p.pulse) * 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, pulseR, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(185, 100%, 52%, ${p.a})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; };
    window.addEventListener("resize", onResize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", onResize); };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none hidden md:block" style={{ opacity: 0.5 }} />;
}

/* ── Live agent feed ── */
const agentEvents = [
  { icon: Activity, color: "text-primary", text: "Scout — port:8443 exposed detecté", time: "0s" },
  { icon: Zap, color: "text-accent", text: "Analyst — plan de remédiation généré", time: "12s" },
  { icon: CheckCircle2, color: "text-success", text: "DSI — Go/No-Go validé en 1 clic", time: "23s" },
  { icon: Lock, color: "text-warning", text: "Executor — port fermé automatiquement", time: "35s" },
  { icon: Shield, color: "text-success", text: "Evidence Vault — preuve cryptographique ✓", time: "47s" },
];

function AgentFeed() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((i) => (i + 1) % agentEvents.length);
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-1.5">
      {agentEvents.map((ev, i) => (
        <motion.div
          key={i}
          animate={{
            opacity: i === activeIndex ? 1 : i < activeIndex ? 0.45 : 0.2,
            x: i === activeIndex ? 0 : -2,
          }}
          transition={{ duration: 0.4 }}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono ${i === activeIndex ? "bg-primary/8 border border-primary/20" : ""}`}
        >
          <ev.icon className={`w-3 h-3 flex-shrink-0 ${i === activeIndex ? ev.color : "text-muted-foreground/40"}`} />
          <span className={i === activeIndex ? "text-foreground/90" : "text-muted-foreground/40"}>{ev.text}</span>
          <span className={`ml-auto ${i === activeIndex ? "text-primary/60" : "text-muted-foreground/30"}`}>{ev.time}</span>
        </motion.div>
      ))}
    </div>
  );
}

const container = { initial: {}, animate: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { initial: { opacity: 0, y: 32 }, animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } } } as const;

export function HeroSection() {
  const navigate = useNavigate();
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);
  const cta = usePublicCta();
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, -60]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Backgrounds */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 gradient-radial" />
      <div className="absolute inset-0 gradient-radial-purple opacity-50" />
      <div className="absolute inset-0 grid-pattern" />

      <NeuralField />

      {/* Organic ambient orbs */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.06, 0.14, 0.06] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/6 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(185 100% 52% / 0.18) 0%, transparent 65%)" }}
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        className="absolute bottom-1/4 right-1/6 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(258 90% 66% / 0.15) 0%, transparent 65%)" }}
      />

      <motion.div style={{ opacity: heroOpacity, y: heroY }} className="container relative z-10 px-4 py-16">
        <motion.div variants={container} initial="initial" animate="animate" className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left: Content */}
            <div className="space-y-7">
              {/* Badge */}
              <motion.div variants={fadeUp}>
                <div className="label-badge label-badge-cyan w-fit">
                  <Cpu className="w-3 h-3" />
                  Digital Immune System · 6 Agents IA · God Mode 2026
                </div>
              </motion.div>

              {/* Headline */}
              <motion.div variants={fadeUp} className="space-y-3">
                <h1 className="text-4xl md:text-5xl xl:text-6xl font-bold leading-[1.0] tracking-tight">
                  <span className="text-foreground block">SECURIT-E</span>
                  <span className="text-gradient neon-text block">Votre armure</span>
                  <span className="text-foreground block">de gouvernance cyber</span>
                  <span className="text-gradient block">autonome</span>
                </h1>
              </motion.div>

              {/* Sub */}
              <motion.p variants={fadeUp} className="text-base text-muted-foreground leading-relaxed max-w-lg">
                <span className="text-foreground font-semibold">Détecte · Prédit · Répare seul · Prouve pour toujours.</span>{" "}
                DSI valide en 1 clic ou mode fully autonomous.{" "}
                <span className="text-primary font-semibold">Zéro équipe. 100% souverain France.</span>
              </motion.p>

              {/* CTAs */}
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="h-12 px-6 text-sm font-bold neon-glow btn-magnetic hover:scale-[1.03] transition-all gap-2 group"
                  onClick={() => {
                    trackEvent('cta_essai_gratuit', { source_page: '/', cta_origin: 'hero_primary' });
                    navigate('/auth?tab=signup');
                  }}
                >
                  <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                  Essayer gratuitement 14 jours
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="h-12 px-5 text-sm border-border hover:border-primary/40 hover:bg-primary/5 gap-2 group transition-all"
                  onClick={() => {
                    trackEvent('cta_voir_demo', { source_page: '/', cta_origin: 'hero_ghost' });
                    navigate('/demo');
                  }}
                >
                  <CalendarDays className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Voir la démo agents (47s)
                </Button>
              </motion.div>

              {/* Trust badges */}
              <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
                {[
                  { label: "Self-healing autonome", color: "text-success", bg: "bg-success/10", dot: "bg-success" },
                  { label: "Evidence post-quantique", color: "text-primary", bg: "bg-primary/10", dot: "bg-primary" },
                  { label: "100% Souverain 🇫🇷", color: "text-accent", bg: "bg-accent/10", dot: "bg-accent" },
                  { label: "Score Audit 97/100 ✅", color: "text-warning", bg: "bg-warning/10", dot: "bg-warning" },
                ].map((b, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.6 + i * 0.1, type: "spring" }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-card text-xs font-medium ${b.color}`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${b.dot} animate-pulse`} />
                    {b.label}
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Right: Live agent dashboard */}
            <motion.div variants={fadeUp} className="hidden lg:block relative">
              <div className="absolute inset-0 blur-3xl rounded-3xl pointer-events-none"
                style={{ background: "radial-gradient(circle, hsl(185 100% 52% / 0.12) 0%, transparent 70%)" }} />

              <div className="relative glass-card-premium p-5 space-y-4 rounded-2xl">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                    <span className="text-xs font-mono text-muted-foreground">IMMUNE SYSTEM · LIVE</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="label-badge label-badge-cyan text-[10px]">
                      <Lock className="w-2.5 h-2.5" /> SOUVERAIN FR
                    </span>
                  </div>
                </div>

                {/* Agent swarm progress */}
                <div className="p-3 rounded-xl bg-secondary/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-muted-foreground">SWARM AGENTS — OPÉRATION EN COURS</span>
                    <span className="text-primary font-mono font-bold">47s</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 4.7, ease: "linear", repeat: Infinity, repeatDelay: 2 }}
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, hsl(var(--neon-cyan)), hsl(var(--neon-blue)), hsl(var(--neon-cyan)))" }}
                    />
                  </div>
                </div>

                {/* Live feed */}
                <AgentFeed />

                {/* Bottom stats */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
                  {[
                    { v: "6", l: "Agents actifs", c: "text-primary" },
                    { v: "0", l: "Intervention humaine", c: "text-success" },
                    { v: "∞", l: "Preuves vault", c: "text-accent" },
                  ].map((s, i) => (
                    <div key={i} className="text-center p-2 rounded-lg bg-secondary/30">
                      <div className={`text-lg font-bold font-mono ${s.c}`}>{s.v}</div>
                      <div className="text-[9px] text-muted-foreground leading-tight mt-0.5">{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating chips */}
              <motion.div
                animate={{ y: [-5, 5, -5] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 glass-card px-3 py-1.5 flex items-center gap-1.5 rounded-xl"
              >
                <CheckCircle2 className="w-3 h-3 text-success" />
                <span className="text-xs font-medium">Fully Autonomous ✓</span>
              </motion.div>
              <motion.div
                animate={{ y: [5, -5, 5] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute -bottom-4 -left-4 glass-card px-3 py-1.5 flex items-center gap-1.5 rounded-xl"
              >
                <Lock className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium">Preuve Vault ✓</span>
              </motion.div>
            </motion.div>
          </div>

          {/* Video demo embed — 47s sequence */}
          <motion.div
            variants={fadeUp}
            className="mt-8 rounded-2xl overflow-hidden border border-primary/20 glass-card-premium"
          >
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border/40 bg-secondary/20">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-[11px] font-mono text-muted-foreground">DÉMO LIVE — Cycle complet 47s : Scout → Analyst → Go/No-Go → Executor → Vault</span>
              <span className="ml-auto label-badge label-badge-cyan text-[9px]">LIVE SIM</span>
            </div>
            {/* Simulated video player with 47s timeline */}
            <div className="relative bg-background/80 p-5 space-y-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex gap-1.5">
                  {["Scout", "Analyst", "Go/No-Go", "Executor", "Vault"].map((step, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
                      className="text-[9px] font-mono px-2 py-0.5 rounded border border-primary/20 bg-primary/5 text-primary/70"
                    >
                      {step}
                    </motion.div>
                  ))}
                </div>
                <div className="ml-auto text-[10px] font-mono text-primary font-bold">
                  <motion.span
                    animate={{ opacity: [1, 0.4, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >⏱ 00:47</motion.span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 4.7, ease: "linear", repeat: Infinity, repeatDelay: 1.5 }}
                  className="h-full rounded-full"
                  style={{ background: "linear-gradient(90deg, hsl(var(--neon-cyan)), hsl(var(--neon-blue)), hsl(var(--success)))" }}
                />
              </div>
              <div className="text-[10px] text-muted-foreground/60 font-mono text-center">
                Vidéo démo HD disponible sur demande — <span className="text-primary cursor-pointer hover:underline">Book 15-min demo →</span>
              </div>
            </div>
          </motion.div>

          {/* Pricing strip */}
          <motion.div
            variants={fadeUp}
            className="mt-8 pt-6 border-t border-border/30 flex flex-wrap items-center gap-6 text-sm"
          >
            <div className="flex items-center gap-2.5">
              <div className="label-badge label-badge-cyan"><Cpu className="w-3 h-3" /> Starter 490€ / an</div>
              <span className="text-muted-foreground text-xs">Tout inclus · Sans surprise</span>
            </div>
            <div className="text-xs text-muted-foreground/60 font-mono">Pro 6 900€ · Enterprise 29 900€</div>
          </motion.div>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />

      <DemoRequestDialog open={demoDialogOpen} onOpenChange={setDemoDialogOpen} ctaOrigin="hero_cta" sourcePage="/" />
    </section>
  );
}
