/**
 * BootstrapBanner
 *
 * Displays the explicit first-run / nominal state of the platform.
 * Only renders when action is needed (bootstrap_incomplete or config_missing).
 * Uses useBootstrapState — fully data-driven, no decorative statuses.
 */

import { AlertTriangle, CheckCircle2, ArrowRight, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useBootstrapState } from '@/hooks/useBootstrapState';

export function BootstrapBanner() {
  const bs = useBootstrapState();

  if (bs.phase === 'loading') {
    return (
      <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        Vérification de l'état de configuration...
      </div>
    );
  }

  if (bs.phase === 'public_config_ready') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-success/10 border border-success/30 text-sm">
        <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="font-medium text-success">Mode nominal actif</span>
          <span className="text-muted-foreground ml-2 font-mono text-xs">
            tenant_resolved: {bs.tenantResolved ? 'true' : 'false'} · source: {bs.publicConfigSource}
          </span>
        </div>
        {bs.actionRoute && (
          <Button variant="ghost" size="sm" asChild className="h-7 text-xs shrink-0">
            <Link to={bs.actionRoute}>Modifier <ExternalLink className="h-3 w-3 ml-1" /></Link>
          </Button>
        )}
      </div>
    );
  }

  // bootstrap_incomplete, config_missing, or tenant_ready — action needed
  const isBlocking = bs.phase === 'bootstrap_incomplete';

  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-lg border text-sm ${
      isBlocking
        ? 'bg-destructive/10 border-destructive/30'
        : 'bg-warning/10 border-warning/30'
    }`}>
      <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${isBlocking ? 'text-destructive' : 'text-warning'}`} />
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${isBlocking ? 'text-destructive' : 'text-warning'}`}>
          {bs.phase === 'bootstrap_incomplete' && 'Bootstrap incomplet — aucune organisation en base'}
          {bs.phase === 'config_missing' && 'Tenant résolu — URLs commerciales manquantes'}
          {bs.phase === 'tenant_ready' && 'Tenant en cours de résolution — configurez les URLs'}
        </p>
        <p className="text-muted-foreground text-xs mt-0.5 font-mono">
          tenant_resolved: {bs.tenantResolved ? 'true' : 'false'} ·
          source: {bs.publicConfigSource} ·
          CTAs publics: {bs.hasCommercialUrls ? 'DB-aware' : 'fallback env/lead'}
        </p>
        {bs.phase !== 'bootstrap_incomplete' && (
          <p className="text-muted-foreground text-xs mt-1">
            {bs.phase === 'config_missing'
              ? 'L\'organisation est en base mais booking_url et checkout_url sont vides. Les CTAs publics tombent en fallback lead capture.'
              : 'L\'organisation existe mais app_runtime_config n\'a pas encore de données publiques servies.'}
          </p>
        )}
      </div>
      {bs.actionRoute && (
        <Button
          variant={isBlocking ? 'destructive' : 'outline'}
          size="sm"
          asChild
          className="h-7 text-xs shrink-0"
        >
          <Link to={bs.actionRoute}>
            {bs.actionLabel ?? 'Configurer'}
            <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      )}
    </div>
  );
}
