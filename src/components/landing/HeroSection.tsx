import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { Shield, ArrowRight, Sparkles, FlaskConical, CalendarDays, Lock, Zap, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DemoRequestDialog } from "@/components/ui/DemoRequestDialog";
import { trackEvent } from "@/lib/tracking";
import { usePublicCta } from "@/hooks/usePublicCta";

/* ── Particle system ── */
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const particles: Array<{
      x: number; y: number; vx: number; vy: number;
      r: number; a: number; da: number;
    }> = [];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * W,
        y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.3,
        a: Math.random(),
        da: (Math.random() - 0.5) * 0.004,
      });
    }

    let raf: number;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.a += p.da;
        if (p.a < 0.1) p.da = Math.abs(p.da);
        if (p.a > 0.7) p.da = -Math.abs(p.da);
        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(185, 100%, 52%, ${p.a})`;
        ctx.fill();
      });
      // connection lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.strokeStyle = `hsla(185, 100%, 52%, ${0.08 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();

    const onResize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.6 }}
    />
  );
}

/* ── Orbiting shield ── */
function OrbitalShield() {
  return (
    <div className="relative w-72 h-72 mx-auto flex items-center justify-center">
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border border-primary/10 animate-[spin_20s_linear_infinite]" />
      {/* Mid ring */}
      <div className="absolute inset-8 rounded-full border border-neon-cyan/15 animate-[spin_14s_linear_infinite_reverse]" />
      {/* Inner glow */}
      <div className="absolute inset-16 rounded-full bg-primary/5 blur-xl" />

      {/* Orbiting dots */}
      {[0, 72, 144, 216, 288].map((deg, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full bg-primary"
          style={{ top: "50%", left: "50%", transformOrigin: "0 0" }}
          animate={{ rotate: [deg, deg + 360] }}
          transition={{ duration: 12 + i * 2, repeat: Infinity, ease: "linear" }}
        >
          <div
            className="w-2 h-2 rounded-full bg-primary neon-glow-sm"
            style={{
              transform: `translateX(100px) translateY(-4px)`,
            }}
          />
        </motion.div>
      ))}

      {/* Core shield */}
      <div className="relative z-10 w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center neon-glow pulse-glow">
        <Shield className="w-12 h-12 text-primary" />
      </div>
    </div>
  );
}

/* ── Stat ticker ── */
function LiveStatBadge({ value, label, color }: { value: string; label: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, type: "spring" }}
      className="glass-card px-4 py-2.5 flex items-center gap-3"
    >
      <div className={`w-2 h-2 rounded-full ${color} animate-pulse`} />
      <div>
        <div className={`text-sm font-bold font-mono ${color === "bg-success" ? "text-success" : color === "bg-primary" ? "text-primary" : "text-accent"}`}>{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </motion.div>
  );
}

const container = {
  initial: {},
  animate: { transition: { staggerChildren: 0.08 } },
};

const fadeUp = {
  initial: { opacity: 0, y: 32 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
} as const;

export function HeroSection() {
  const navigate = useNavigate();
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);
  const cta = usePublicCta();
  const { scrollY } = useScroll();
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroY = useTransform(scrollY, [0, 400], [0, -60]);

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Deep space background */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 gradient-radial" />
      <div className="absolute inset-0 gradient-radial-purple" />
      <div className="absolute inset-0 grid-pattern opacity-100" />

      {/* Particle field */}
      <ParticleField />

      {/* Ambient orbs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.08, 0.15, 0.08] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/4 left-1/6 w-96 h-96 rounded-full"
        style={{ background: "radial-gradient(circle, hsl(185 100% 52% / 0.2) 0%, transparent 70%)" }}
      />
      <motion.div
        animate={{ scale: [1, 1.15, 1], opacity: [0.06, 0.12, 0.06] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute bottom-1/3 right-1/6 w-80 h-80 rounded-full"
        style={{ background: "radial-gradient(circle, hsl(258 90% 66% / 0.2) 0%, transparent 70%)" }}
      />

      <motion.div
        style={{ opacity: heroOpacity, y: heroY }}
        className="container relative z-10 px-4 py-16"
      >
        <motion.div
          variants={container}
          initial="initial"
          animate="animate"
          className="max-w-5xl mx-auto"
        >
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Content */}
            <div className="space-y-8">
              {/* Status badge */}
              <motion.div variants={fadeUp}>
                <div className="label-badge label-badge-cyan w-fit">
                  <Sparkles className="w-3 h-3" />
                  Gouvernance Cyber · RGPD &amp; NIS2 · God Mode 2026
                </div>
              </motion.div>

              {/* Headline */}
              <motion.div variants={fadeUp} className="space-y-3">
                <h1 className="text-5xl md:text-6xl xl:text-7xl font-bold leading-[0.95] tracking-tight">
                  <span className="text-foreground block">Prouvez votre</span>
                  <span className="text-gradient neon-text block">cybersécurité</span>
                  <span className="text-foreground block">à votre Direction</span>
                </h1>
              </motion.div>

              {/* Sub */}
              <motion.p variants={fadeUp} className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Importez vos rapports. Obtenez en quelques clics un rapport Direction, 
                un plan de remédiation et vos preuves de conformité.{" "}
                <span className="text-foreground font-semibold">Zéro jargon. 100% auditables.</span>
              </motion.p>

              {/* CTAs */}
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  className="h-13 px-7 text-base font-bold neon-glow btn-magnetic hover:scale-105 transition-all gap-2 group"
                  onClick={() => {
                    trackEvent('cta_voir_demo', { source_page: '/', cta_origin: 'hero_primary' });
                    navigate('/demo');
                  }}
                >
                  <FlaskConical className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  Voir la démo
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  className="h-13 px-6 text-base border-primary/30 hover:border-primary/60 hover:bg-primary/5 gap-2 group transition-all"
                  disabled={cta.isLoading}
                  onClick={() => {
                    trackEvent('cta_demander_demo', { source_page: '/', cta_origin: 'hero_ghost' });
                    cta.handleDemoRequest({
                      sourcePage: '/',
                      ctaOrigin: 'hero_ghost',
                      onFallback: () => setDemoDialogOpen(true),
                    });
                  }}
                >
                  <CalendarDays className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  Demander une démo
                </Button>
              </motion.div>

              {/* Trust indicators */}
              <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
                <LiveStatBadge value="100%" label="Conforme RGPD" color="bg-success" />
                <LiveStatBadge value="NIS2" label="Prêt 2026" color="bg-primary" />
                <LiveStatBadge value="🇫🇷 FR" label="Hébergé en France" color="bg-accent" />
              </motion.div>
            </div>

            {/* Right: Visual */}
            <motion.div
              variants={fadeUp}
              className="hidden lg:flex items-center justify-center relative"
            >
              {/* Dashboard mockup card */}
              <div className="relative w-full max-w-sm">
                {/* Glow backdrop */}
                <div className="absolute inset-0 blur-3xl rounded-3xl" style={{ background: "radial-gradient(circle, hsl(185 100% 52% / 0.15) 0%, transparent 70%)" }} />

                <div className="relative glass-card-premium p-6 space-y-4 rounded-2xl">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                      <span className="text-xs font-mono text-muted-foreground">SENTINEL EDGE · LIVE</span>
                    </div>
                    <span className="label-badge label-badge-cyan text-[10px]">
                      <Lock className="w-2.5 h-2.5" /> SOUVERAIN
                    </span>
                  </div>

                  {/* Score */}
                  <div className="text-center py-4">
                    <div className="text-6xl font-bold font-mono text-gradient neon-text">87</div>
                    <div className="text-sm text-muted-foreground mt-1">Score de maturité cyber</div>
                    <div className="mt-3 w-full bg-muted rounded-full h-1.5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "87%" }}
                        transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: "linear-gradient(90deg, hsl(var(--neon-cyan)), hsl(var(--neon-blue)))" }}
                      />
                    </div>
                  </div>

                  {/* Mini stats */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: "Risques", value: "12", color: "text-destructive" },
                      { label: "Corrigés", value: "8", color: "text-success" },
                      { label: "Preuves", value: "34", color: "text-primary" },
                    ].map((s, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 + i * 0.1 }}
                        className="rounded-xl bg-secondary/50 p-3 text-center"
                      >
                        <div className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">{s.label}</div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Bottom bar */}
                  <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                    <Zap className="w-3 h-3 text-primary" />
                    <span className="text-xs text-muted-foreground">Rapport Direction généré il y a 3min</span>
                  </div>
                </div>

                {/* Floating pills */}
                <motion.div
                  animate={{ y: [-4, 4, -4] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-5 -right-6 glass-card px-3 py-1.5 flex items-center gap-1.5 rounded-xl"
                >
                  <Eye className="w-3 h-3 text-accent" />
                  <span className="text-xs text-foreground font-medium">Rapport DG prêt</span>
                </motion.div>

                <motion.div
                  animate={{ y: [4, -4, 4] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute -bottom-4 -left-6 glass-card px-3 py-1.5 flex items-center gap-1.5 rounded-xl"
                >
                  <Shield className="w-3 h-3 text-success" />
                  <span className="text-xs text-foreground font-medium">Evidence Vault ✓</span>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Pricing anchor */}
          <motion.div
            variants={fadeUp}
            className="mt-16 pt-8 border-t border-border/40 flex flex-wrap items-center gap-6 text-sm"
          >
            <div className="flex items-center gap-2">
              <div className="label-badge label-badge-cyan">
                <Shield className="w-3 h-3" />
                490€ TTC / an
              </div>
              <span className="text-muted-foreground">Tout inclus · Sans surprise</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="w-1 h-1 rounded-full bg-border" />
              <span>4 900€ Pro · 24 900€ Enterprise</span>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />

      <DemoRequestDialog
        open={demoDialogOpen}
        onOpenChange={setDemoDialogOpen}
        ctaOrigin="hero_cta"
        sourcePage="/"
      />
    </section>
  );
}
