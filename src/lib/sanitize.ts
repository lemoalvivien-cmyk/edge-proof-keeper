/**
 * SENTINEL EDGE — Client-side sanitization helpers
 * Use before rendering any user/import-originated text in the UI.
 */

/**
 * Strip control characters and encode HTML-dangerous chars.
 * Hard-caps field length at 4096 chars (same as edge function).
 */
export function sanitizeText(input: unknown, maxLength = 4096): string {
  if (typeof input !== 'string') return String(input ?? '');
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim()
    .slice(0, maxLength);
}

/**
 * Sanitize a severity label to one of the canonical values.
 */
export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export function sanitizeSeverity(raw: unknown): SeverityLevel {
  const map: Record<string, SeverityLevel> = {
    critical: 'critical',
    high: 'high',
    medium: 'medium',
    moderate: 'medium',
    low: 'low',
    info: 'info',
    informational: 'info',
    none: 'info',
  };
  const normalized = String(raw ?? 'info').toLowerCase().trim();
  return map[normalized] ?? 'info';
}

/**
 * Sanitize a finding status.
 */
export type FindingStatus = 'open' | 'acknowledged' | 'remediated' | 'false_positive';

export function sanitizeFindingStatus(raw: unknown): FindingStatus {
  const allowed: FindingStatus[] = ['open', 'acknowledged', 'remediated', 'false_positive'];
  const val = String(raw ?? 'open').toLowerCase().trim() as FindingStatus;
  return allowed.includes(val) ? val : 'open';
}

/**
 * Normalize a single raw finding object into the canonical NormalizedFinding shape.
 * Safe to call with arbitrary untrusted data.
 */
export interface NormalizedFinding {
  id: string;
  title: string;
  severity: SeverityLevel;
  finding_type: string;
  description: string;
  evidence: string;
  references: string[];
  status: FindingStatus;
  asset_id: string | null;
  tool_run_id: string;
  organization_id: string;
  first_seen: string;
  updated_at: string;
  /** Original DB row preserved for full-detail views */
  _raw: Record<string, unknown>;
}

export function normalizeDbFinding(row: Record<string, unknown>): NormalizedFinding {
  const evidence = row.evidence as Record<string, unknown> | null | undefined;
  return {
    id: String(row.id ?? ''),
    title: sanitizeText(row.title ?? 'Unnamed finding'),
    severity: sanitizeSeverity(row.severity),
    finding_type: sanitizeText(row.finding_type ?? 'unknown', 256),
    description: sanitizeText(evidence?.description ?? evidence?.message ?? '', 8192),
    evidence: sanitizeText(evidence?.matched ?? evidence?.output ?? evidence?.raw ?? '', 8192),
    references: Array.isArray(row.references)
      ? (row.references as unknown[]).map(r => sanitizeText(r, 1024)).slice(0, 20)
      : [],
    status: sanitizeFindingStatus(row.status),
    asset_id: row.asset_id ? String(row.asset_id) : null,
    tool_run_id: String(row.tool_run_id ?? ''),
    organization_id: String(row.organization_id ?? ''),
    first_seen: String(row.first_seen ?? new Date().toISOString()),
    updated_at: String(row.updated_at ?? new Date().toISOString()),
    _raw: row,
  };
}
