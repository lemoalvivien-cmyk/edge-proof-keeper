/**
 * GuidedTour — 3-step Framer Motion overlay, première visite uniquement.
 * Respecte prefers-reduced-motion.
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Shield, Zap, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TOUR_KEY = 'securit_e_tour_done_v1';

const STEPS = [
  {
    icon: Shield,
    title: 'Bienvenue sur SECURIT-E',
    desc: 'Votre cockpit cyber autonome est prêt. Des données démo réalistes ont été injectées pour vous montrer la puissance de la plateforme.',
    cta: 'Suivant',
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  {
    icon: Zap,
    title: 'Agents autonomes en action',
    desc: '6 agents IA travaillent en parallèle : ils détectent, corrèlent, et réparent automatiquement. Aucune intervention humaine requise.',
    cta: 'Suivant',
    color: 'text-accent',
    bg: 'bg-accent/10',
  },
  {
    icon: BarChart3,
    title: 'Evidence Vault sécurisé',
    desc: 'Chaque action est enregistrée dans un vault cryptographique NIS2-compliant. Cliquez "Lancer analyse immédiate" pour démarrer votre première vraie analyse.',
    cta: 'Commencer !',
    color: 'text-success',
    bg: 'bg-success/10',
  },
];

interface GuidedTourProps {
  forceShow?: boolean;
}

export function GuidedTour({ forceShow = false }: GuidedTourProps) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  // Respect prefers-reduced-motion
  const prefersReduced = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  useEffect(() => {
    if (forceShow) { setVisible(true); return; }
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) {
      // Slight delay so page loads first
      const t = setTimeout(() => setVisible(true), 800);
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
    : { initial: { opacity: 0, scale: 0.92, y: 16 }, animate: { opacity: 1, scale: 1, y: 0 }, exit: { opacity: 0, scale: 0.94, y: -12 } };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* Tour card */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              key={step}
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: prefersReduced ? 0.1 : 0.35, ease: 'easeOut' }}
              className="pointer-events-auto w-full max-w-sm rounded-2xl border border-border bg-card shadow-2xl p-6"
            >
              {/* Close */}
              <button onClick={dismiss} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>

              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl ${current.bg} flex items-center justify-center mb-4`}>
                <Icon className={`w-6 h-6 ${current.color}`} />
              </div>

              {/* Content */}
              <h3 className="text-lg font-bold text-foreground mb-2">{current.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">{current.desc}</p>

              {/* Progress dots */}
              <div className="flex items-center gap-1.5 mb-4">
                {STEPS.map((_, i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'}`} />
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <button onClick={dismiss} className="text-xs text-muted-foreground hover:text-foreground">
                  Passer le tour
                </button>
                <Button size="sm" onClick={next} className="gap-1.5">
                  {current.cta}
                  {step < STEPS.length - 1 && <ArrowRight className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
