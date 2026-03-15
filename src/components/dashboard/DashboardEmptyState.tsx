/**
 * DashboardEmptyState — Never shown empty. Always provides action.
 */
import { motion } from 'framer-motion';
import { Zap, Play, Shield, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardEmptyStateProps {
  onLaunchDemo: () => void;
  onLaunchAnalysis: () => void;
  isLoading?: boolean;
  variant?: 'findings' | 'tasks' | 'full';
}

export function DashboardEmptyState({ onLaunchDemo, onLaunchAnalysis, isLoading, variant = 'full' }: DashboardEmptyStateProps) {
  if (variant === 'findings') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-8 space-y-4"
      >
        <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">Aucun finding pour l'instant</p>
          <p className="text-sm text-muted-foreground mt-1">Lancez votre première analyse pour détecter des vulnérabilités.</p>
        </div>
        <Button size="sm" onClick={onLaunchAnalysis} disabled={isLoading} className="gap-2">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Lancer ma première analyse autonome
        </Button>
      </motion.div>
    );
  }

  if (variant === 'tasks') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-6 space-y-3"
      >
        <p className="text-sm text-muted-foreground">Aucune tâche de remédiation active</p>
        <Button size="sm" variant="outline" onClick={onLaunchDemo} disabled={isLoading} className="gap-2">
          <Play className="w-4 h-4" />
          Revoir la démo 47s
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-8 text-center space-y-5"
    >
      <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
        <Zap className="w-8 h-8 text-primary" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-foreground">Lancez votre première analyse autonome</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
          Vos agents IA vont détecter, corréler et planifier la remédiation automatiquement — en moins de 47 secondes.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button onClick={onLaunchAnalysis} disabled={isLoading} className="gap-2">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          Lancer analyse immédiate
        </Button>
        <Button variant="outline" onClick={onLaunchDemo} disabled={isLoading} className="gap-2">
          <Play className="w-4 h-4" />
          Voir la démo 47s
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
}
