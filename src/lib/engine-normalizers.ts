/**
 * engine-normalizers.ts
 *
 * Single source of truth for all signal / entity normalisation logic
 * consumed by api-client, Signals page, and any future modules.
 *
 * Rules:
 * - No external imports (pure TS, no Supabase)
 * - No side effects
 * - Every function must be deterministic
 */

import type { Signal, EntityType } from '@/types/engine';

// ─── Severity ─────────────────────────────────────────────────────────────────

const SEVERITY_MAP: Record<string, string> = {
  critical: 'critical',
  crit: 'critical',
  high: 'high',
  medium: 'medium',
  med: 'medium',
  moderate: 'medium',
  low: 'low',
  info: 'info',
  informational: 'info',
  none: 'info',
};

export function normalizeSeverity(input: string | null | undefined): string {
  if (!input) return 'info';
  return SEVERITY_MAP[input.trim().toLowerCase()] ?? 'info';
}

// ─── Signal status ────────────────────────────────────────────────────────────

const SIGNAL_STATUS_MAP: Record<string, string> = {
  new: 'new',
  open: 'open',
  acknowledged: 'acknowledged',
  correlated: 'correlated',
  ignored: 'ignored',
  resolved: 'resolved',
  closed: 'closed',
};

export function normalizeSignalStatus(input: string | null | undefined): string {
  if (!input) return 'new';
  return SIGNAL_STATUS_MAP[input.trim().toLowerCase()] ?? 'new';
}

// ─── Signal text ──────────────────────────────────────────────────────────────

export function sanitizeSignalText(input: string | null | undefined, maxLen = 500): string {
  if (!input) return '';
  return input.trim().slice(0, maxLen).replace(/[\u0000-\u001F\u007F]/g, '');
}

// ─── Signal references (DB column is `signal_refs`, type expects `references`) ─

/**
 * Normalise a raw DB row from `signals` into a typed Signal object.
 * Handles the `signal_refs → references` alias transparently.
 */
export function normalizeSignalRecord(row: Record<string, unknown>): Signal {
  return {
    ...row,
    references: (row.signal_refs ?? row.references ?? []) as unknown[],
  } as unknown as Signal;
}

/**
 * Map an array of raw DB rows to Signal objects.
 */
export function normalizeSignalRows(rows: Record<string, unknown>[]): Signal[] {
  return rows.map(normalizeSignalRecord);
}

// ─── Entity value normalisation ───────────────────────────────────────────────

const DOMAIN_RE   = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
const IP_RE       = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE      = /^https?:\/\//i;
const REPO_RE     = /github\.com|gitlab\.com|bitbucket\.org/i;
const CERT_HASH_RE = /^[0-9a-f]{40,64}$/i;

export function normalizeEntityValue(type: EntityType, raw: string): string {
  const v = raw.trim();
  switch (type) {
    case 'domain':
    case 'subdomain':
      return v.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase();
    case 'email':
      return v.toLowerCase();
    case 'ip':
      return v.split('.').map(o => String(parseInt(o, 10))).join('.');
    case 'certificate':
      return v.toLowerCase().replace(/[^0-9a-f]/g, '');
    case 'repository':
      return v.toLowerCase().replace(/\.git$/, '');
    default:
      return v.toLowerCase();
  }
}

export function detectEntityType(value: string): EntityType | null {
  const v = value.trim();
  if (!v) return null;

  let host = v;
  if (URL_RE.test(v)) {
    try {
      host = new URL(v).hostname;
    } catch {
      host = v.replace(/^https?:\/\//i, '').split('/')[0];
    }
  }

  if (IP_RE.test(host))       return 'ip';
  if (EMAIL_RE.test(v))       return 'email';
  if (REPO_RE.test(v))        return 'repository';
  if (CERT_HASH_RE.test(v))   return 'certificate';
  if (DOMAIN_RE.test(host)) {
    return host.split('.').length > 2 ? 'subdomain' : 'domain';
  }
  return null;
}

export function buildEntityKey(entityType: EntityType, canonicalValue: string): string {
  return `${entityType}:${canonicalValue.trim().toLowerCase()}`;
}

// ─── Confidence display ───────────────────────────────────────────────────────

export function formatConfidence(score: number | null | undefined): string | null {
  if (score == null) return null;
  return `${Math.round(score * 100)}%`;
}

// ─── Date formatting ──────────────────────────────────────────────────────────

export function formatSignalDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}
