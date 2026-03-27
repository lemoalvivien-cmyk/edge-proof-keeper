/**
 * GuidedTour — Wow flow en 3 étapes · Framer Motion · première visite uniquement.
 * Respecte prefers-reduced-motion.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Shield, Zap, Lock, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const TOUR_KEY = 'securit_e_tour_done_v1';

const STEPS = [
  {
    icon: Shield,
    badge: '🚀 Bienvenue',
    title: 'Votre armure cyber est active',
    desc: 'Des données de démonstration réalistes ont été injectées automatiquement pour vous montrer la puissance immédiate de la plateforme.',
    highlight: 'Score : 28/100 — 3 critiques détectés',
    highlightColor: 'text-destructive',
    cta: 'Voir le cockpit',
    color: 'text-primary',
    bg: 'bg-primary/10 border-primary/20',
    glowColor: 'hsl(185 100% 52% / 0.15)',
  },
  {
    icon: Zap,
    badge: '⚡ 47 secondes (lab)',
    title: '6 agents IA supervisés',
    desc: 'Scout détecte, Analyst priorise, Executor répare avec votre validation Go/No-Go, Vault prouve. Cycle de 47s mesuré en conditions de laboratoire contrôlées.',
    highlight: 'Cliquez "Lancer analyse 47s" pour voir la démo',
    highlightColor: 'text-primary',
    cta: 'Suivant',
    color: 'text-accent',
    bg: 'bg-accent/10 border-accent/20',
    glowColor: 'hsl(258 90% 66% / 0.12)',
  },
  {
    icon: Lock,
    badge: '✓ NIS2 & RGPD',
    title: 'Chaque action est une preuve',
    desc: 'L\'Evidence Vault signe chaque remédiation avec SHA-256 Merkle Chain. Exportable pour audit CNIL ou contrôleur NIS2.',
    highlight: 'Preuves archivées (démo) — immuables',
    highlightColor: 'text-success',
    cta: 'Commencer !',
    color: 'text-success',
    bg: 'bg-success/10 border-success/20',
    glowColor: 'hsl(158 80% 46% / 0.12)',
  },
];

interface GuidedTourProps {
  forceShow?: boolean;
}

export function GuidedTour({ forceShow = false }: GuidedTourProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();

  const prefersReduced = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  useEffect(() => {
    if (forceShow) { setVisible(true); return; }
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) {
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, [forceShow]);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(TOUR_KEY, 'true');
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  };

  if (!visible) return null;

  const current = STEPS[step];
  const Icon = current.icon;

  const variants = prefersReduced
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : { initial: { opacity: 0, scale: 0.94, y: 20 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.96, y: -12 } };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* Card */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key={step}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: prefersReduced ? 0.1 : 0.3, ease: 'easeOut' }}
              className="pointer-events-auto w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
            >
              {/* Glow top strip */}
              <div
                className="h-1 w-full"
                style={{ background: `linear-gradient(90deg, transparent, ${current.glowColor.replace('0.12', '0.7')}, transparent)` }}
              />

              <div className="p-6 relative">
                {/* Close */}
                <button
                  onClick={dismiss}
                  className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Badge */}
                <div className="mb-4">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${current.bg} ${current.color}`}>
                    {current.badge}
                  </span>
                </div>

                {/* Icon */}
                <div
                  className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-4 ${current.bg}`}
                >
                  <Icon className={`w-6 h-6 ${current.color}`} />
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-foreground mb-2">{current.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">{current.desc}</p>

                {/* Highlight */}
                <div className={`text-xs font-mono font-semibold flex items-center gap-1.5 mb-5 ${current.highlightColor}`}>
                  <ChevronRight className="w-3 h-3 flex-shrink-0" />
                  {current.highlight}
                </div>

                {/* Progress dots */}
                <div className="flex items-center gap-1.5 mb-5">
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        i === step ? 'w-8 bg-primary' :
                        i < step ? 'w-2 bg-primary/40' :
                        'w-2 bg-muted-foreground/20'
                      }`}
                    />
                  ))}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={dismiss}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Passer
                  </button>
                  <Button size="sm" onClick={next} className="gap-1.5 font-semibold">
                    {current.cta}
                    {step < STEPS.length - 1
                      ? <ArrowRight className="w-3.5 h-3.5" />
                      : null
                    }
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
