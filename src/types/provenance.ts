/**
 * SECURIT-E — Data Provenance System
 * Every metric displayed in the UI must carry its provenance.
 * No synthetic data may be presented as real.
 */

/** Data provenance classification — no grey zone */
export type DataProvenance = 'real' | 'derived' | 'simulated';

/** Metadata attached to any displayed metric */
export interface ProvenanceTag {
  provenance: DataProvenance;
  /** Where the data comes from (table name, edge function, formula) */
  source: string;
  /** When the data was last refreshed */
  refreshedAt?: string;
  /** If derived, the formula used */
  formula?: string;
}

/** Labels and styles for each provenance level */
export const PROVENANCE_CONFIG: Record<DataProvenance, {
  label: string;
  shortLabel: string;
  color: string;
  bgColor: string;
  borderColor: string;
  /** Can this data be exported in client/auditor reports? */
  exportable: boolean;
}> = {
  real: {
    label: 'Donnée réelle',
    shortLabel: 'RÉEL',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    exportable: true,
  },
  derived: {
    label: 'Donnée dérivée',
    shortLabel: 'DÉRIVÉ',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    exportable: true,
  },
  simulated: {
    label: 'Donnée simulée',
    shortLabel: 'SIMULÉ',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    exportable: false,
  },
};

/**
 * Determine provenance based on whether real data is available.
 * Use this helper in widgets that have demo fallbacks.
 */
export function resolveProvenance(hasRealData: boolean, isDerived = false): DataProvenance {
  if (!hasRealData) return 'simulated';
  return isDerived ? 'derived' : 'real';
}

/**
 * Guard: prevent simulated data from being included in exports.
 * Returns true if data can be exported.
 */
export function isExportable(provenance: DataProvenance): boolean {
  return PROVENANCE_CONFIG[provenance].exportable;
}
