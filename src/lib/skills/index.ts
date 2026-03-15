/**
 * SECURIT-E — Skills Index
 * All 6 skills now call the real execute-skill Edge Function.
 * Real SHA-256 proofs, structured logs, Evidence Vault writes.
 */
import { supabase } from '@/integrations/supabase/client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export interface SkillExecutionResult {
  success: boolean;
  skill: string;
  duration_ms: number;
  proof: {
    hash: string;
    merkle_root: string;
    algorithm: string;
    timestamp: string;
    vault_logged: boolean;
  };
  result: Record<string, unknown>;
  logs: string[];
}

export async function executeSkill(
  skill: string,
  params: Record<string, unknown>,
  organizationId?: string
): Promise<SkillExecutionResult> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Session required to execute skills');

  const res = await fetch(`${SUPABASE_URL}/functions/v1/execute-skill`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      apikey: SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ skill, params, organization_id: organizationId }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json?.error ?? `HTTP ${res.status}`);

  return {
    ...json,
    logs: (json.result?.logs as string[]) ?? [],
  };
}

// ── Typed skill helpers ────────────────────────────────────────────────────
export const Skills = {
  fix_port: (params: Record<string, unknown>, orgId?: string) =>
    executeSkill('fix_port', params, orgId),

  rotate_creds: (params: Record<string, unknown>, orgId?: string) =>
    executeSkill('rotate_creds', params, orgId),

  close_domain: (params: Record<string, unknown>, orgId?: string) =>
    executeSkill('close_domain', params, orgId),

  patch_vuln: (params: Record<string, unknown>, orgId?: string) =>
    executeSkill('patch_vuln', params, orgId),

  notify_rollback: (params: Record<string, unknown>, orgId?: string) =>
    executeSkill('notify_rollback', params, orgId),

  swarm_collaborate: (params: Record<string, unknown>, orgId?: string) =>
    executeSkill('swarm_collaborate', params, orgId),
} as const;

/**
 * Skill registry for Executor Agent auto-dispatch (legacy compat)
 */
export const SKILL_REGISTRY = {
  fix_port:          () => import('./fix_port').then((m) => m.fixPort),
  rotate_creds:      () => import('./rotate_creds').then((m) => m.rotateCreds),
  close_domain:      () => import('./close_domain').then((m) => m.closeDomain),
  patch_vuln:        () => import('./patch_vuln').then((m) => m.patchVuln),
  notify_rollback:   () => import('./notify_rollback').then((m) => m.notifyRollback),
  swarm_collaborate: () => import('./swarm_collaborate').then((m) => m.swarmCollaborate),
} as const;

export type SkillName = keyof typeof SKILL_REGISTRY;

export const SKILL_METADATA: Record<SkillName, { label: string; category: string; agent: string }> = {
  fix_port:          { label: 'Fermer port exposé',       category: 'network',      agent: 'Executor' },
  rotate_creds:      { label: 'Rotation credentials',     category: 'identity',     agent: 'Executor' },
  close_domain:      { label: 'Neutraliser domaine',      category: 'dns',          agent: 'Executor' },
  patch_vuln:        { label: 'Patcher CVE',              category: 'patching',     agent: 'Executor' },
  notify_rollback:   { label: 'Notifier + Rollback',      category: 'recovery',     agent: 'Verifier' },
  swarm_collaborate: { label: 'Swarm Intelligence',       category: 'intelligence', agent: 'Swarm' },
};

// Re-export legacy individual skill functions (no-op stubs replaced by real edge calls)
export { fixPort } from './fix_port';
export type { FixPortInput } from './fix_port';
export { rotateCreds } from './rotate_creds';
export type { RotateCredsInput } from './rotate_creds';
export { closeDomain } from './close_domain';
export type { CloseDomainInput } from './close_domain';
export { patchVuln } from './patch_vuln';
export type { PatchVulnInput } from './patch_vuln';
export { notifyRollback } from './notify_rollback';
export type { NotifyRollbackInput } from './notify_rollback';
export { swarmCollaborate } from './swarm_collaborate';
export type { SwarmSignal, SwarmCollaborateInput } from './swarm_collaborate';
