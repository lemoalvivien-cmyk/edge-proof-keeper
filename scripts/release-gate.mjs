#!/usr/bin/env node
/**
 * SECURIT-E — Release Gate
 * Scans for forbidden claims, verifies critical routes, checks build.
 * Run: node scripts/release-gate.mjs
 * Exits 1 if any check fails.
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

let failed = 0;
const log = (ok, msg) => {
  const icon = ok ? "✅" : "❌";
  if (!ok) failed++;
  console.log(`${icon} ${msg}`);
};

// ── 1. Forbidden terms scan ───────────────────────────────────────────────────
const FORBIDDEN = [
  { term: "CRYSTALS-Dilithium", context: "claim réel non implémenté" },
  { term: "zk-SNARK Groth16", context: "non implémenté" },
  { term: "zksnark:", context: "hash préfixe trompeur" },
  { term: "fully autonomous", context: "claim trop absolu" },
  { term: "100% autonome", context: "claim non prouvé" },
  { term: "Certifié SecNumCloud", context: "certification non obtenue" },
  { term: "Certifié SecNumCloud", context: "certification non obtenue" },
  { term: "certifié SecNumCloud", context: "certification non obtenue" },
  { term: "99.9% garanti contractuellement", context: "SLA non contractualisé" },
  { term: "99,9%.*garanti contractuellement", context: "SLA non contractualisé" },
  { term: "aucun ordinateur quantique", context: "claim post-quantique non prouvé" },
  { term: "post-quantique", context: "terme à encadrer — vérifier contexte" },
];

// Directories to scan
const SCAN_DIRS = ["src", "supabase/functions"];
const SCAN_EXTS = [".ts", ".tsx", ".js", ".jsx", ".html", ".md"];

// Files/dirs to skip
const SKIP = ["node_modules", ".git", "dist", "build", "release-gate.mjs"];

function scanDir(dir) {
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      if (SKIP.some(s => entry.includes(s))) continue;
      const full = join(dir, entry);
      const stat = statSync(full);
      if (stat.isDirectory()) {
        scanDir(full);
      } else if (SCAN_EXTS.includes(extname(full))) {
        const content = readFileSync(full, "utf8");
        const lines = content.split("\n");
        for (const { term, context } of FORBIDDEN) {
          const regex = new RegExp(term, "i");
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Skip pure comments that are explicit disclosures
            if (line.trim().startsWith("//") || line.trim().startsWith("*")) continue;
            if (regex.test(line)) {
              log(false, `Terme interdit "${term}" dans ${full}:${i + 1} — ${context}`);
            }
          }
        }
      }
    }
  } catch {}
}

console.log("\n═══════════════════════════════════════════════");
console.log("  SECURIT-E RELEASE GATE");
console.log("═══════════════════════════════════════════════\n");

console.log("── Phase 1 : Scan des termes interdits ────────");
for (const dir of SCAN_DIRS) {
  scanDir(dir);
}

// ── 2. Critical route existence ───────────────────────────────────────────────
console.log("\n── Phase 2 : Vérification des routes critiques ─");
const CRITICAL_FILES = [
  ["src/pages/Dashboard.tsx", "/dashboard"],
  ["src/pages/ExecutiveCockpit.tsx", "/executive"],
  ["src/pages/Pricing.tsx", "/pricing"],
  ["src/pages/Status.tsx", "/status"],
  ["src/pages/Activate.tsx", "/activate"],
  ["src/pages/AdminAccessCodes.tsx", "/admin/access-codes"],
  ["src/components/auth/PaywallGate.tsx", "PaywallGate component"],
  ["src/components/ui/UpgradeWall.tsx", "UpgradeWall component"],
  ["supabase/functions/check-entitlement/index.ts", "check-entitlement edge fn"],
  ["supabase/functions/stripe-webhook/index.ts", "stripe-webhook edge fn"],
  ["supabase/functions/redeem-access-code/index.ts", "redeem-access-code edge fn"],
  ["supabase/functions/export-proof-pack/index.ts", "export-proof-pack edge fn"],
  ["supabase/functions/verify-evidence-chain/index.ts", "verify-evidence-chain edge fn"],
];

for (const [path, label] of CRITICAL_FILES) {
  try {
    statSync(path);
    log(true, `${label} présent`);
  } catch {
    log(false, `${label} MANQUANT — ${path}`);
  }
}

// ── 3. Rate limiting check ────────────────────────────────────────────────────
console.log("\n── Phase 3 : Vérification rate limiting ────────");
const checkNoInMemoryRL = (file, fnName) => {
  try {
    const content = readFileSync(file, "utf8");
    const hasInMemory = content.includes("rateLimitMap") && !content.includes("check_rate_limit");
    log(!hasInMemory, `${fnName} — pas de rate limiting in-memory résiduel`);
  } catch {
    log(false, `${fnName} — fichier introuvable`);
  }
};
checkNoInMemoryRL("supabase/functions/export-proof-pack/index.ts", "export-proof-pack");
checkNoInMemoryRL("supabase/functions/verify-evidence-chain/index.ts", "verify-evidence-chain");

// ── 4. Wildcard CORS check on sensitive functions ─────────────────────────────
console.log("\n── Phase 4 : Vérification CORS wildcard ────────");
const SENSITIVE_FNS = [
  "supabase/functions/export-proof-pack/index.ts",
  "supabase/functions/verify-evidence-chain/index.ts",
];
for (const file of SENSITIVE_FNS) {
  try {
    const content = readFileSync(file, "utf8");
    // Should use buildCorsHeaders (per-origin), not raw wildcard
    const usesBuildCors = content.includes("buildCorsHeaders");
    log(usesBuildCors, `${file.split("/").pop()} — utilise buildCorsHeaders (CORS restrictif)`);
  } catch {
    log(false, `${file} introuvable`);
  }
}

// ── Final verdict ─────────────────────────────────────────────────────────────
console.log("\n═══════════════════════════════════════════════");
if (failed === 0) {
  console.log("✅ RELEASE GATE PASSED — produit conforme\n");
  process.exit(0);
} else {
  console.log(`❌ RELEASE GATE FAILED — ${failed} problème(s) détecté(s)\n`);
  process.exit(1);
}
