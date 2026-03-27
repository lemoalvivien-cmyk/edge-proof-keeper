/**
 * SECURIT-E — Execution Mode Types
 * Strict binary separation: simulated vs supervised_real.
 * Every skill execution MUST carry its mode.
 */

/** The two execution modes — no grey zone */
export type ExecutionMode = 'simulated' | 'supervised_real';

/** Preconditions required for supervised_real execution */
export interface RealExecutionPreconditions {
  /** Valid authorization exists for the org */
  authorization_valid: boolean;
  /** Go/No-Go approved by human operator */
  go_nogo_approved: boolean;
  /** Real connector/integration is available */
  connector_available: boolean;
  /** Audit trail is writable */
  audit_trail_ready: boolean;
}

/** Result of checking preconditions — fail-closed */
export interface PreconditionCheckResult {
  allowed: boolean;
  mode: ExecutionMode;
  /** Which preconditions failed (empty if all pass) */
  failures: string[];
}

/** Badges / labels for UI rendering */
export const EXECUTION_MODE_LABELS: Record<ExecutionMode, {
  badge: string;
  color: string;
  bgColor: string;
  borderColor: string;
  logPrefix: string;
}> = {
  simulated: {
    badge: 'SIMULATION',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    logPrefix: '[SIMULATION]',
  },
  supervised_real: {
    badge: 'EXÉCUTION SUPERVISÉE',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-500/10',
    borderColor: 'border-emerald-500/30',
    logPrefix: '[SUPERVISED]',
  },
};

/**
 * Check all preconditions for supervised_real execution.
 * Fail-closed: if ANY precondition is missing → simulated.
 * No silent fallback — returns explicit failure list.
 */
export function checkRealExecutionPreconditions(
  preconditions: Partial<RealExecutionPreconditions>
): PreconditionCheckResult {
  const failures: string[] = [];

  if (!preconditions.authorization_valid) {
    failures.push('Autorisation valide absente');
  }
  if (!preconditions.go_nogo_approved) {
    failures.push('Approbation Go/No-Go requise');
  }
  if (!preconditions.connector_available) {
    failures.push('Connecteur réel non disponible');
  }
  if (!preconditions.audit_trail_ready) {
    failures.push('Journal d\'audit non prêt');
  }

  return {
    allowed: failures.length === 0,
    mode: failures.length === 0 ? 'supervised_real' : 'simulated',
    failures,
  };
}

/**
 * Prefix log lines with execution mode tag.
 * Simulated logs MUST be distinguishable from real ones.
 */
export function tagLogs(logs: string[], mode: ExecutionMode): string[] {
  const prefix = EXECUTION_MODE_LABELS[mode].logPrefix;
  return logs.map(log => {
    // Don't double-prefix
    if (log.startsWith('[SIMULATION]') || log.startsWith('[SUPERVISED]')) return log;
    return `${prefix} ${log}`;
  });
}

/** Guard: throws if mode is supervised_real but preconditions fail */
export function requireRealExecution(
  preconditions: Partial<RealExecutionPreconditions>
): void {
  const check = checkRealExecutionPreconditions(preconditions);
  if (!check.allowed) {
    throw new Error(
      `Exécution réelle impossible — préconditions manquantes : ${check.failures.join(', ')}`
    );
  }
}
