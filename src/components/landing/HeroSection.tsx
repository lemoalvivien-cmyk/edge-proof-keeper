import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Shield, ArrowRight, CalendarDays, Lock, Zap, Activity, CheckCircle2, TrendingUp, AlertTriangle } from "lucide-react";
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
    for (let i = 0; i < 55; i++) {
      nodes.push({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
        r: Math.random() * 1.8 + 0.4,
        a: Math.random() * 0.5 + 0.1, da: (Math.random() - 0.5) * 0.002,
        pulse: Math.random() * Math.PI * 2,
      });
    }

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `hsla(185, 100%, 52%, ${0.05 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.3;
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.stroke();
          }
        }
      }
      nodes.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        p.a += p.da; p.pulse += 0.02;
        if (p.a < 0.05) p.da = Math.abs(p.da);
        if (p.a > 0.6) p.da = -Math.abs(p.da);
        if (p.x < 0) p.x = W; if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; if (p.y > H) p.y = 0;
        const pulseR = p.r + Math.sin(p.pulse) * 0.4;
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

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none hidden md:block" style={{ opacity: 0.45 }} />;
}

/* ── Animated threat counter ── */
function ThreatCounter() {
  const [count, setCount] = useState(2841);
  useEffect(() => {
    const t = setInterval(() => setCount(c => c + Math.floor(Math.random() * 3)), 3500);
    return () => clearInterval(t);
  }, []);
  return <span className="font-mono text-primary tabular-nums">{count.toLocaleString('fr-FR')}</span>;
}

/* ── Live agent feed ── */
const agentEvents = [
  { icon: Activity, color: "text-primary", text: "Scout — port:8443 exposé détecté", time: "0s" },
  { icon: Zap, color: "text-accent", text: "Analyst — plan de remédiation généré", time: "12s" },
  { icon: CheckCircle2, color: "text-success", text: "DSI — Go validé en 1 clic", time: "23s" },
  { icon: Lock, color: "text-warning", text: "Executor — port fermé automatiquement", time: "35s" },
  { icon: Shield, color: "text-success", text: "Vault — preuve cryptographique ✓", time: "47s" },
];

function AgentFeed() {
  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setActiveIndex((i) => (i + 1) % agentEvents.length), 2200);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="space-y-1.5">
      {agentEvents.map((ev, i) => (
        <motion.div
          key={i}
          animate={{ opacity: i === activeIndex ? 1 : i < activeIndex ? 0.4 : 0.18, x: i === activeIndex ? 0 : -2 }}
          transition={{ duration: 0.35 }}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-mono ${i === activeIndex ? "bg-primary/8 border border-primary/20" : ""}`}
        >
          <ev.icon className={`w-3 h-3 flex-shrink-0 ${i === activeIndex ? ev.color : "text-muted-foreground/30"}`} />
          <span className={i === activeIndex ? "text-foreground/90" : "text-muted-foreground/30"}>{ev.text}</span>
          <span className={`ml-auto font-bold ${i === activeIndex ? "text-primary/70" : "text-muted-foreground/20"}`}>{ev.time}</span>
        </motion.div>
      ))}
    </div>
  );
}

const fadeUp = { initial: { opacity: 0, y: 28 }, animate: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" } } } as const;
const container = { initial: {}, animate: { transition: { staggerChildren: 0.09 } } };

export function HeroSection() {
  const navigate = useNavigate();
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);
  const cta = usePublicCta();
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 380], [1, 0]);
  const heroY = useTransform(scrollY, [0, 380], [0, -50]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Backgrounds */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 gradient-radial" />
      <div className="absolute inset-0 gradient-radial-purple opacity-40" />
      <div className="absolute inset-0 grid-pattern" />
      <NeuralField />

      {/* Ambient orbs */}
      <motion.div
        animate={{ scale: [1, 1.25, 1], opacity: [0.06, 0.13, 0.06] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/6 w-[480px] h-[480px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(185 100% 52% / 0.16) 0%, transparent 65%)" }}
      />
      <motion.div
        animate={{ scale: [1, 1.18, 1], opacity: [0.04, 0.09, 0.04] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut", delay: 4 }}
        className="absolute bottom-1/4 right-1/8 w-[360px] h-[360px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, hsl(258 90% 66% / 0.12) 0%, transparent 65%)" }}
      />

      <motion.div style={{ opacity: heroOpacity, y: heroY }} className="container relative z-10 px-4 py-16">
        <motion.div variants={container} initial="initial" animate="animate" className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-14 items-center">

            {/* ── LEFT: Copy ── */}
            <div className="space-y-8">

              {/* Urgency badge */}
              <motion.div variants={fadeUp} className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-destructive/40 bg-destructive/8 text-xs font-semibold text-destructive">
                  <AlertTriangle className="w-3 h-3" />
                  NIS2 en vigueur · Amendes jusqu'à 10M€
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/8 text-xs font-semibold text-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse inline-block" />
                  🇫🇷 100% Souverain France
                </div>
              </motion.div>

              {/* Main headline — value-first */}
              <motion.div variants={fadeUp} className="space-y-2">
                <h1 className="text-4xl md:text-5xl xl:text-[3.25rem] font-bold leading-[1.05] tracking-tight">
                  <span className="text-foreground/60 text-2xl md:text-3xl font-semibold block mb-2">Votre entreprise sous cyberattaque dans</span>
                  <span className="text-gradient neon-text block">47 secondes</span>
                  <span className="text-foreground block">de détection</span>
                  <span className="text-foreground block">à preuve cryptographique.</span>
                </h1>
              </motion.div>

              {/* Sub — business-focused */}
              <motion.p variants={fadeUp} className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-md">
                SECURIT-E est le <span className="text-foreground font-semibold">centre de commandement cyber assisté par IA</span> pour dirigeants et DSI exigeants.{" "}
                6 agents IA détectent, réparent et prouvent — <span className="text-primary font-semibold">avec supervision humaine, sans jargon, sans compromis.</span>
              </motion.p>

              {/* Primary CTAs */}
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="h-13 px-7 text-sm font-bold neon-glow btn-magnetic hover:scale-[1.02] transition-all gap-2 group"
                  onClick={() => {
                    trackEvent('cta_essai_gratuit', { source_page: '/', cta_origin: 'hero_primary' });
                    navigate('/auth?tab=signup');
                  }}
                >
                  <Shield className="w-4 h-4" />
                  Activer mon essai — 14j gratuit
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="h-13 px-5 text-sm border-border/70 hover:border-primary/50 hover:bg-primary/5 gap-2 group transition-all"
                  onClick={() => {
                    trackEvent('cta_voir_demo', { source_page: '/', cta_origin: 'hero_ghost' });
                    navigate('/demo');
                  }}
                >
                  <CalendarDays className="w-4 h-4" />
                  Voir le cycle 47s en live
                </Button>
              </motion.div>

              {/* Micro-trust: friction removers */}
              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-success" /> Essai 14j sans engagement</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-success" /> Annulation libre</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-success" /> Prise en main guidée</span>
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-success" /> Déploiement en 15 min</span>
              </motion.div>

              {/* Live stats strip */}
              <motion.div variants={fadeUp} className="grid grid-cols-3 gap-3">
                {[
                  { v: "47s", l: "Détection → preuve", c: "text-primary" },
                  { v: "0", l: "Équipe cyber requise", c: "text-success" },
                  { v: "10M€", l: "Amende NIS2 max évitée", c: "text-warning" },
                ].map((s, i) => (
                  <div key={i} className="text-center p-3 rounded-xl glass-card border border-border/60">
                    <div className={`text-xl font-bold font-mono ${s.c}`}>{s.v}</div>
                    <div className="text-[10px] text-muted-foreground leading-tight mt-0.5">{s.l}</div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* ── RIGHT: Live cockpit preview ── */}
            <motion.div variants={fadeUp} className="hidden lg:block relative">
              <div className="absolute inset-0 blur-3xl rounded-3xl pointer-events-none"
                style={{ background: "radial-gradient(circle, hsl(185 100% 52% / 0.10) 0%, transparent 70%)" }} />

              <div className="relative glass-card-premium p-5 space-y-4 rounded-2xl border border-primary/15">
                {/* Window header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-destructive/50" />
                      <div className="w-2.5 h-2.5 rounded-full bg-warning/50" />
                      <div className="w-2.5 h-2.5 rounded-full bg-success/50" />
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground ml-2">securit-e.com/dashboard</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-success/10 border border-success/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                    <span className="text-[10px] font-mono text-success font-semibold">LIVE · 6 AGENTS ACTIFS</span>
                  </div>
                </div>

                {/* Score maturité */}
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">Score Gouvernance Cyber</div>
                      <div className="text-4xl font-bold font-mono text-gradient neon-text mt-1">87<span className="text-lg text-muted-foreground">/100</span></div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-muted-foreground">Preuves vault</div>
                      <div className="text-xl font-bold font-mono text-primary"><ThreatCounter /></div>
                      <div className="text-[9px] text-muted-foreground font-mono">archivées · immuables</div>
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "87%" }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, hsl(var(--neon-cyan)), hsl(var(--neon-blue)))" }}
                    />
                  </div>
                </div>

                {/* Cycle progression */}
                <div className="p-3 rounded-xl bg-secondary/20 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-muted-foreground">CYCLE EN COURS — SWARM AUTONOME</span>
                    <motion.span
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="text-primary font-mono font-bold"
                    >⏱ 47s</motion.span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 4.7, ease: "linear", repeat: Infinity, repeatDelay: 2 }}
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, hsl(var(--neon-cyan)), hsl(var(--neon-blue)), hsl(var(--success)))" }}
                    />
                  </div>
                </div>

                {/* Live agent feed */}
                <AgentFeed />

                {/* ROI bottom strip */}
                <div className="pt-3 border-t border-border/40">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Coût moyen évité par an</span>
                    <span className="font-mono font-bold text-success">≥ 180 000€</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-muted-foreground">Votre investissement</span>
                    <span className="font-mono font-bold text-primary">490€ / an</span>
                  </div>
                  <div className="mt-2 text-center">
                    <span className="text-[10px] font-mono text-success/80">ROI estimé (base : coût moyen incident cyber)</span>
                  </div>
                </div>
              </div>

              {/* Floating chips */}
              <motion.div
                animate={{ y: [-4, 4, -4] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-4 -right-4 glass-card px-3 py-1.5 flex items-center gap-1.5 rounded-xl border border-success/30 shadow-lg"
              >
                <CheckCircle2 className="w-3 h-3 text-success" />
                <span className="text-xs font-semibold">NIS2 Documenté ✓</span>
              </motion.div>
              <motion.div
                animate={{ y: [4, -4, 4] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                className="absolute -bottom-4 -left-4 glass-card px-3 py-1.5 flex items-center gap-1.5 rounded-xl border border-primary/30 shadow-lg"
              >
                <Lock className="w-3 h-3 text-primary" />
                <span className="text-xs font-semibold">Preuve SHA-256 ✓</span>
              </motion.div>
            </motion.div>
          </div>

          {/* Social proof strip below hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
            className="mt-14 pt-8 border-t border-border/30"
          >
            <p className="text-center text-xs text-muted-foreground/50 font-mono uppercase tracking-widest mb-6">
              Approuvé par des DSI, RSSI et dirigeants d'ETI françaises
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { v: "12", l: "ETI en accès prioritaire", icon: "🏭" },
                { v: "< 15 min", l: "Déploiement initial", icon: "⚡" },
                { v: "2 841+", l: "Preuves archivées", icon: "🔐" },
                { v: "0", l: "Faux positif cette semaine", icon: "✅" },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + i * 0.08 }}
                  className="text-center px-4 py-3 rounded-xl glass-card border border-border/50"
                >
                  <div className="text-lg mb-1">{s.icon}</div>
                  <div className="text-lg font-bold font-mono text-foreground">{s.v}</div>
                  <div className="text-[10px] text-muted-foreground">{s.l}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      <DemoRequestDialog open={demoDialogOpen} onOpenChange={setDemoDialogOpen} ctaOrigin="hero_demo" sourcePage="/" />
    </section>
  );
}
