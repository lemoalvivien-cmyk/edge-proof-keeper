/**
 * SENTINEL IMMUNE — Skills Index
 * Executor Agent skill registry — all skills called via Edge Agent (mTLS)
 */

export { fixPort } from "./fix_port";
export type { FixPortInput } from "./fix_port";

export { rotateCreds } from "./rotate_creds";
export type { RotateCredsInput } from "./rotate_creds";

export { patchVuln } from "./patch_vuln";
export type { PatchVulnInput } from "./patch_vuln";

export { swarmCollaborate } from "./swarm_collaborate";
export type { SwarmSignal, SwarmCollaborateInput } from "./swarm_collaborate";

/**
 * Skill registry for Executor Agent auto-dispatch
 */
export const SKILL_REGISTRY = {
  fix_port: () => import("./fix_port").then((m) => m.fixPort),
  rotate_creds: () => import("./rotate_creds").then((m) => m.rotateCreds),
  patch_vuln: () => import("./patch_vuln").then((m) => m.patchVuln),
  swarm_collaborate: () => import("./swarm_collaborate").then((m) => m.swarmCollaborate),
} as const;

export type SkillName = keyof typeof SKILL_REGISTRY;
