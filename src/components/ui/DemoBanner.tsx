import { FlaskConical, X } from 'lucide-react';
import { useState } from 'react';

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-warning/10 border-b border-warning/30 px-4 py-2.5 text-sm">
      <div className="flex items-center gap-2 text-warning-foreground font-medium">
        <FlaskConical className="h-4 w-4 text-warning shrink-0" />
        <span>
          <span className="font-semibold">Mode démonstration</span>
          {' '}—{' '}
          <span className="text-muted-foreground font-normal">
            Données simulées à des fins de présentation. Aucune donnée réelle n'est affichée.
          </span>
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="shrink-0 rounded p-0.5 hover:bg-warning/20 transition-colors"
        aria-label="Fermer la bannière"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}
