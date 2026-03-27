import { FlaskConical } from 'lucide-react';

export function DemoBanner() {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-center gap-3 bg-warning/10 border-b border-warning/30 px-4 py-2.5 text-sm">
      <div className="flex items-center gap-2 text-warning-foreground font-medium">
        <FlaskConical className="h-4 w-4 text-warning shrink-0" />
        <span>
          <span className="font-semibold">Simulation produit</span>
          {' '}—{' '}
          <span className="text-muted-foreground font-normal">
            Données fictives — aucune action réelle sur votre infrastructure
          </span>
        </span>
      </div>
    </div>
  );
}
