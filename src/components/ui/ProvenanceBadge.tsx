/**
 * ProvenanceBadge — displays the provenance of a displayed metric.
 * MUST be shown next to any widget that can display simulated data.
 */
import { PROVENANCE_CONFIG } from '@/types/provenance';
import type { DataProvenance } from '@/types/provenance';
import { Badge } from '@/components/ui/badge';

interface ProvenanceBadgeProps {
  provenance: DataProvenance;
  className?: string;
  /** Show tooltip with source info */
  source?: string;
}

export function ProvenanceBadge({ provenance, className = '', source }: ProvenanceBadgeProps) {
  const config = PROVENANCE_CONFIG[provenance];

  return (
    <Badge
      variant="outline"
      className={`text-[9px] px-1.5 py-0 font-mono ${config.color} ${config.bgColor} ${config.borderColor} ${className}`}
      title={source ? `${config.label} — source : ${source}` : config.label}
    >
      {config.shortLabel}
    </Badge>
  );
}
