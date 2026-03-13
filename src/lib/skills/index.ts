/**
 * SENTINEL IMMUNE — Skills Index
 * Executor Agent skill registry — 6 OpenClaw skills called via Edge Agent (mTLS + WireGuard)
 * Each skill: validate → log intent → callEdgeAgent → generateZkProof → return SkillResult
 */

export { fixPort } from "./fix_port";
export type { FixPortInput } from "./fix_port";

export { rotateCreds } from "./rotate_creds";
export type { RotateCredsInput } from "./rotate_creds";

export { closeDomain } from "./close_domain";
export type { CloseDomainInput } from "./close_domain";

export { patchVuln } from "./patch_vuln";
export type { PatchVulnInput } from "./patch_vuln";

export { notifyRollback } from "./notify_rollback";
export type { NotifyRollbackInput } from "./notify_rollback";

export { swarmCollaborate } from "./swarm_collaborate";
export type { SwarmSignal, SwarmCollaborateInput } from "./swarm_collaborate";

/**
 * Skill registry for Executor Agent auto-dispatch
 * Each entry: () => Promise<SkillFn> — lazy-loaded to keep bundle lightweight
 */
export const SKILL_REGISTRY = {
  fix_port:          () => import("./fix_port").then((m) => m.fixPort),
  rotate_creds:      () => import("./rotate_creds").then((m) => m.rotateCreds),
  close_domain:      () => import("./close_domain").then((m) => m.closeDomain),
  patch_vuln:        () => import("./patch_vuln").then((m) => m.patchVuln),
  notify_rollback:   () => import("./notify_rollback").then((m) => m.notifyRollback),
  swarm_collaborate: () => import("./swarm_collaborate").then((m) => m.swarmCollaborate),
} as const;

export type SkillName = keyof typeof SKILL_REGISTRY;

/**
 * Skill metadata for UI display in God Mode dashboard
 */
export const SKILL_METADATA: Record<SkillName, { label: string; category: string; agent: string }> = {
  fix_port:          { label: "Fermer port exposé",       category: "network",     agent: "Executor" },
  rotate_creds:      { label: "Rotation credentials",     category: "identity",    agent: "Executor" },
  close_domain:      { label: "Neutraliser domaine",      category: "dns",         agent: "Executor" },
  patch_vuln:        { label: "Patcher CVE",              category: "patching",    agent: "Executor" },
  notify_rollback:   { label: "Notifier + Rollback",      category: "recovery",    agent: "Verifier" },
  swarm_collaborate: { label: "Swarm Intelligence",       category: "intelligence", agent: "Swarm" },
};

