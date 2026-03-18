#!/usr/bin/env node
/**
 * SECURIT-E — Release Gate v2
 * Scanne les termes interdits, vérifie les routes critiques, contrôle CORS/rate-limit.
 * Run: node scripts/release-gate.mjs
 * Exits 1 if any check fails.
 */

import { readFileSync, readdirSync, statSync } from "fs";
import { join, extname } from "path";

const SMOKE_ONLY = process.argv.includes("--smoke-only");

let failed = 0;
let warned = 0;
const log = (ok, msg, isWarn = false) => {
  const icon = ok ? "✅" : (isWarn ? "⚠️ " : "❌");
  if (!ok && !isWarn) failed++;
  if (!ok && isWarn) warned++;
  console.log(`${icon} ${msg}`);
};

// ── 1. Forbidden terms scan ───────────────────────────────────────────────────
const FORBIDDEN = [
  // Crypto claims non implémentés
  { term: "CRYSTALS-Dilithium", context: "algorithme post-quantique non implémenté — utiliser SHA-256 Merkle Chain" },
  { term: "zk-SNARK Groth16", context: "non implémenté dans le code réel" },
  { term: "zk-SNARK", context: "non implémenté — vérifier le contexte" },
  { term: "zksnark:", context: "hash préfixe trompeur" },
  { term: "Kyber-1024", context: "algorithme post-quantique non implémenté" },
  { term: "post-quantique", context: "terme à encadrer — vérifier que c'est dans un commentaire ou roadmap" },
  { term: "post-quantum", context: "terme à encadrer — vérifier que c'est dans un commentaire ou roadmap" },
  // Autonomie absolue
  { term: "fully autonomous", context: "claim trop absolu — utiliser 'supervisé' ou 'assisté'" },
  { term: "fully_autonomous", context: "claim trop absolu — vérifier le contexte" },
  { term: "100% autonome", context: "claim non prouvé" },
  { term: "Zéro équipe RSSI", context: "claim absolu — utiliser 'sans expertise cyber poussée'" },
  { term: "zéro équipe", context: "vérifier le contexte — toléré si clairement encadré" },
  // Certifications non obtenues
  { term: "certifié SecNumCloud", context: "certification non obtenue à ce jour" },
  { term: "Certifié SecNumCloud", context: "certification non obtenue à ce jour" },
  { term: "hébergement certifié SecNumCloud", context: "non prouvé" },
  // SLA/ROI garantis sans base contractuelle
  { term: "99.9% garanti contractuellement", context: "SLA non contractualisé" },
  { term: "99,9%.*garanti contractuellement", context: "SLA non contractualisé" },
  { term: "SLA 99.99%", context: "SLA non contractualisé dans l'offre publique" },
  { term: "ROI garanti", context: "garantie non prouvée" },
  { term: "ROI.*367", context: "ROI 367x non sourcé" },
  { term: "87%.*prediction", context: "taux de prédiction non prouvé" },
  { term: "87% prediction", context: "taux de prédiction non prouvé" },
  // Claims marketing extrêmes
  { term: "20 ans d'avance", context: "claim non défendable" },
  { term: "aucun ordinateur quantique", context: "claim post-quantique non prouvé" },
  // Scores fixes trompeurs dans le code live (pas dans les démos)
  { term: '"97/100"', context: "score fixe non dérivé de données réelles" },
  { term: '"99/100"', context: "score fixe non dérivé de données réelles" },
  { term: '"100/100"', context: "score fixe non dérivé de données réelles" },
  // Confused NIS2 compliance
  { term: "100% des exigences.*NIS2", context: "couverture 100% non prouvée — utiliser 'couvre les exigences documentaires'" },
  { term: "acceptés par les autorités", context: "vérifier formulation — ne pas garantir l'acceptation" },
  { term: "Proof Packs exportables sont acceptés", context: "garantie d'acceptation non prouvée" },
];

// Files/dirs to skip entirely
const SKIP = ["node_modules", ".git", "dist", "build", "release-gate.mjs", ".lock", "bun.lock"];

// Test files deliberately contain forbidden strings in test assertions — skip their content scan
const SKIP_TEST_FILES = [".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx"];

// These patterns are allowed even if they match (comments, docs explaining what's NOT implemented)
const ALLOWED_CONTEXTS = [
  "// Note:", "* Note:", "// SECURIT-E —", "// Backward", "// Fix", "roadmap",
  "non implémenté", "pas du CRYSTALS", "NOT a real", "// deprecated",
  "ce stade", "objectif", "à ce jour",
];

const SCAN_DIRS = ["src", "supabase/functions", "docs", "scripts", "sentinel-immune-agent"];
const SCAN_EXTS = [".ts", ".tsx", ".js", ".jsx", ".html", ".md"];

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
        // Skip test files — they deliberately contain forbidden strings in test assertions
        if (SKIP_TEST_FILES.some(ext => full.endsWith(ext))) continue;
        const content = readFileSync(full, "utf8");
        const lines = content.split("\n");
        for (const { term, context } of FORBIDDEN) {
          const regex = new RegExp(term, "i");
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // Skip pure comment lines that are explicit disclosures
            if (line.startsWith("//") || line.startsWith("*") || line.startsWith("#")) continue;
            // Skip lines with allowed context
            if (ALLOWED_CONTEXTS.some(a => line.includes(a))) continue;
            if (regex.test(line)) {
              log(false, `Terme interdit "${term}" dans ${full}:${i + 1} — ${context}`);
            }
          }
        }
      }
    }
  } catch {}
}

// Also scan root files
const ROOT_FILES = ["README.md", "index.html"];

console.log("\n═══════════════════════════════════════════════");
console.log("  SECURIT-E RELEASE GATE v2");
console.log("═══════════════════════════════════════════════\n");

if (!SMOKE_ONLY) {
  console.log("── Phase 1 : Scan des termes interdits ────────");
  for (const dir of SCAN_DIRS) {
    scanDir(dir);
  }
  for (const file of ROOT_FILES) {
    try {
      const content = readFileSync(file, "utf8");
      const lines = content.split("\n");
      for (const { term, context } of FORBIDDEN) {
        const regex = new RegExp(term, "i");
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith("//") || line.startsWith("*") || line.startsWith("#")) continue;
          if (ALLOWED_CONTEXTS.some(a => line.includes(a))) continue;
          if (regex.test(line)) {
            log(false, `Terme interdit "${term}" dans ${file}:${i + 1} — ${context}`);
          }
        }
      }
    } catch {}
  }
  if (failed === 0) {
    console.log("✅ Aucun terme interdit trouvé\n");
  }
}

// ── 2. Critical route existence ───────────────────────────────────────────────
console.log("── Phase 2 : Vérification des routes critiques ─");
const CRITICAL_FILES = [
  ["src/pages/Dashboard.tsx", "/dashboard"],
  ["src/pages/ExecutiveCockpit.tsx", "/executive"],
  ["src/pages/Pricing.tsx", "/pricing"],
  ["src/pages/Status.tsx", "/status"],
  ["src/pages/Activate.tsx", "/activate"],
  ["src/pages/AdminAccessCodes.tsx", "/admin/access-codes"],
  ["src/pages/FAQ.tsx", "/faq"],
  ["src/components/auth/PaywallGate.tsx", "PaywallGate component"],
  ["src/components/ui/UpgradeWall.tsx", "UpgradeWall component"],
  ["src/hooks/useEntitlement.ts", "useEntitlement hook"],
  ["src/hooks/useSubscription.ts", "useSubscription hook"],
  ["supabase/functions/check-entitlement/index.ts", "check-entitlement edge fn"],
  ["supabase/functions/stripe-webhook/index.ts", "stripe-webhook edge fn"],
  ["supabase/functions/redeem-access-code/index.ts", "redeem-access-code edge fn"],
  ["supabase/functions/export-proof-pack/index.ts", "export-proof-pack edge fn"],
  ["supabase/functions/verify-evidence-chain/index.ts", "verify-evidence-chain edge fn"],
  ["supabase/functions/create-checkout/index.ts", "create-checkout edge fn"],
  ["supabase/functions/bootstrap-owner/index.ts", "bootstrap-owner edge fn"],
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
checkNoInMemoryRL("supabase/functions/redeem-access-code/index.ts", "redeem-access-code");

// ── 4. Wildcard CORS check on sensitive functions ─────────────────────────────
console.log("\n── Phase 4 : Vérification CORS ─────────────────");
const SENSITIVE_FNS = [
  "supabase/functions/export-proof-pack/index.ts",
  "supabase/functions/verify-evidence-chain/index.ts",
  "supabase/functions/check-entitlement/index.ts",
];
for (const file of SENSITIVE_FNS) {
  try {
    const content = readFileSync(file, "utf8");
    const usesBuildCors = content.includes("buildCorsHeaders") || content.includes("corsHeaders");
    log(usesBuildCors, `${file.split("/").pop()} — utilise corsHeaders (CORS configuré)`);
  } catch {
    log(false, `${file} introuvable`);
  }
}

// ── 5. Auth validation on sensitive functions ─────────────────────────────────
console.log("\n── Phase 5 : Vérification auth/JWT ─────────────");
const AUTH_FNS = [
  "supabase/functions/export-proof-pack/index.ts",
  "supabase/functions/verify-evidence-chain/index.ts",
  "supabase/functions/check-entitlement/index.ts",
  "supabase/functions/create-checkout/index.ts",
];
for (const file of AUTH_FNS) {
  try {
    const content = readFileSync(file, "utf8");
    const hasAuth = content.includes("Authorization") || content.includes("getUser") || content.includes("auth.getUser");
    log(hasAuth, `${file.split("/").pop()} — validation auth présente`);
  } catch {
    log(false, `${file} introuvable`);
  }
}

// ── 6. Hardcoded scores check ─────────────────────────────────────────────────
console.log("\n── Phase 6 : Vérification scores hardcodés ─────");
const SCORE_FILES = [
  "src/pages/Status.tsx",
  "src/pages/Pricing.tsx",
];
for (const file of SCORE_FILES) {
  try {
    const content = readFileSync(file, "utf8");
    // Check for hardcoded uptime scores presented as facts (not in strings labeled as demo)
    const hasUndisclosedHardcoded = /\b(99\.97|99\.99|100\/100|97\/100)\b/.test(content) && !content.includes("demo") && !content.includes("démo") && !content.includes("estimé");
    log(!hasUndisclosedHardcoded, `${file.split("/").pop()} — pas de score hardcodé présenté comme factuel`);
  } catch {
    log(false, `${file} introuvable`);
  }
}

// ── 7. Check package.json has no echo-only test scripts ──────────────────────
console.log("\n── Phase 7 : Vérification scripts package.json ─");
try {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const testScript = pkg.scripts?.test ?? "";
  const e2eScript = pkg.scripts?.["test:e2e"] ?? "";
  
  const testIsOnlyEcho = testScript.startsWith("echo") && !testScript.includes("vitest") && !testScript.includes("playwright");
  const e2eIsOnlyEcho = e2eScript.startsWith("echo") && !e2eScript.includes("playwright");

  log(!testIsOnlyEcho, `package.json test: — pas un simple echo bidon`);
  log(!e2eIsOnlyEcho, `package.json test:e2e — pas un simple echo bidon`);
  log(!!pkg.scripts?.["test:release"], `package.json test:release — présent`);
  log(!!pkg.scripts?.["test:smoke"], `package.json test:smoke — présent`);
} catch {
  log(false, "package.json introuvable ou invalide");
}

// ── 8. Build check ────────────────────────────────────────────────────────────
console.log("\n── Phase 8 : Vérification build ────────────────");
import { execSync } from "child_process";
try {
  execSync("npx tsc --noEmit 2>&1", { stdio: "pipe", timeout: 60000 });
  log(true, "TypeScript — pas d'erreur de compilation");
} catch (e) {
  const output = e.stdout?.toString() || e.stderr?.toString() || "";
  const errorCount = (output.match(/error TS/g) || []).length;
  log(false, `TypeScript — ${errorCount} erreur(s) de compilation détectée(s)`);
}

// ── Final verdict ─────────────────────────────────────────────────────────────
console.log("\n═══════════════════════════════════════════════");
if (failed === 0) {
  if (warned > 0) {
    console.log(`✅ RELEASE GATE PASSED — ${warned} avertissement(s) non bloquant(s)\n`);
  } else {
    console.log("✅ RELEASE GATE PASSED — produit conforme\n");
  }
  process.exit(0);
} else {
  console.log(`❌ RELEASE GATE FAILED — ${failed} problème(s) bloquant(s) détecté(s) · ${warned} avertissement(s)\n`);
  process.exit(1);
}
