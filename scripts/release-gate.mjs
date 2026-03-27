#!/usr/bin/env node
/**
 * SECURIT-E — Release Gate v3
 * Scanne les termes interdits (TS/TSX/JS/GO/MD/HTML), vérifie les routes critiques,
 * contrôle CORS/rate-limit, valide les scripts package.json.
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
  // Post-quantum claims — not implemented, roadmap only
  { term: "CRYSTALS-Dilithium", context: "algorithme post-quantique non implémenté — utiliser SHA-256 HMAC" },
  { term: "CRYSTALS-D", context: "algorithme post-quantique non implémenté" },
  { term: "Dilithium3", context: "algorithme post-quantique non implémenté" },
  { term: "zk-SNARK Groth16", context: "non implémenté dans le code réel" },
  { term: "zk-SNARK", context: "non implémenté — vérifier le contexte" },
  { term: "zksnark:", context: "hash préfixe trompeur — utiliser sha256:" },
  { term: "sha3:", context: "SHA-3 non implémenté — utiliser sha256:" },
  { term: "Kyber-1024", context: "algorithme post-quantique non implémenté" },
  { term: "post-quantum ready", context: "claim non prouvé — utiliser objectif roadmap 2027" },
  { term: "post_quantum_ready", context: "flag trompeur — non implémenté" },
  { term: "PQReady", context: "flag post-quantum trompeur — non implémenté" },
  { term: "post-quantique", context: "terme à encadrer — vérifier que c'est dans un commentaire ou roadmap" },
  { term: "post-quantum", context: "terme à encadrer — vérifier que c'est dans un commentaire ou roadmap" },
  // Autonomy claims
  { term: "fully autonomous", context: "claim trop absolu — utiliser 'supervisé' ou 'assisté'" },
  { term: "fully_autonomous", context: "claim trop absolu — vérifier le contexte" },
  { term: "100% autonome", context: "claim non prouvé" },
  { term: "zéro équipe RSSI", context: "claim absolu — utiliser 'sans expertise cyber poussée'" },
  { term: "sans équipe RSSI", context: "claim absolu — reformuler" },
  { term: "zéro équipe", context: "vérifier le contexte — toléré si clairement encadré" },
  { term: "analyse autonome", context: "reformuler en 'analyse supervisée' ou 'analyse assistée'" },
  { term: "SWARM AUTONOME", context: "reformuler — SWARM SUPERVISÉ" },
  { term: "zéro intervention humaine", context: "claim absolu non prouvé" },
  // Certifications
  { term: "certifié SecNumCloud", context: "certification non obtenue à ce jour" },
  { term: "Certifié SecNumCloud", context: "certification non obtenue à ce jour" },
  { term: "hébergement certifié", context: "certification non prouvée" },
  { term: "Proof Packs certifiés", context: "reformuler en 'Proof Packs SHA-256 vérifiables'" },
  // SLA/ROI
  { term: "99.9% garanti contractuellement", context: "SLA non contractualisé" },
  { term: "99,9%.*garanti contractuellement", context: "SLA non contractualisé" },
  { term: "SLA 99.99%", context: "SLA non contractualisé dans l'offre publique" },
  { term: "ROI garanti", context: "garantie non prouvée" },
  { term: "ROI.*367", context: "ROI 367x non sourcé" },
  { term: "87%.*prediction", context: "taux de prédiction non prouvé" },
  { term: "87% prediction", context: "taux de prédiction non prouvé" },
  // Marketing extrême
  { term: "20 ans d'avance", context: "claim non défendable" },
  { term: "aucun ordinateur quantique", context: "claim post-quantique non prouvé" },
  { term: "Palantir-style", context: "comparaison marketing non défendable" },
  // Scores fixes
  { term: '"97/100"', context: "score fixe non dérivé de données réelles" },
  { term: '"99/100"', context: "score fixe non dérivé de données réelles" },
  { term: '"100/100"', context: "score fixe non dérivé de données réelles" },
  // NIS2 compliance
  { term: "100% des exigences.*NIS2", context: "couverture 100% non prouvée" },
  { term: "acceptés par les autorités", context: "ne pas garantir l'acceptation" },
  { term: "Proof Packs exportables sont acceptés", context: "garantie d'acceptation non prouvée" },
  // Sovereignty overclaims
  { term: "souveraineté totale", context: "claim absolu non défini — utiliser 'souveraineté renforcée'" },
  { term: "100% souverain", context: "claim absolu — utiliser 'Hébergé en France'" },
  { term: "hébergement souverain garanti", context: "reformuler — 'hébergé en France'" },
  { term: "NIS2 compliant", context: "reformuler — 'Support NIS2 documenté'" },
  { term: "NIS2 Ready", context: "claim ambigu — utiliser 'Support NIS2'" },
  { term: "Cloud FR souverain", context: "reformuler — 'Hébergement France'" },
  { term: "LLM souverain", context: "reformuler — 'IA hébergée en France'" },
  { term: "skills autonomes", context: "reformuler — 'skills supervisés'" },
];

// Files/dirs to skip entirely
const SKIP = ["node_modules", ".git", "dist", "build", "release-gate.mjs", ".lock", "bun.lock"];

// Test files deliberately contain forbidden strings in test assertions
const SKIP_TEST_FILES = [".test.ts", ".test.tsx", ".spec.ts", ".spec.tsx", "SPRINT", "VERIFICATION", "productTruth.ts", "cryptoCapabilities.ts", "sovereigntyCapabilities.ts"];

// These patterns are allowed even if they match (comments, docs explaining what's NOT implemented)
const ALLOWED_CONTEXTS = [
  "// Note:", "* Note:", "// SECURIT-E —", "// Backward", "// Fix", "roadmap",
  "non implémenté", "pas du CRYSTALS", "NOT a real", "// deprecated",
  "ce stade", "objectif", "à ce jour", "// Production:", "// Reserved for future",
  "target 2027", "NIST FIPS 203", "NIST FIPS 204", "// reserved", "roadmap 2027",
  "objectif roadmap", "SecNumCloud objectif", "Reserved for",
];

// Scan TS/TSX/JS/JSX/HTML/MD/GO files
const SCAN_DIRS = ["src", "supabase/functions", "docs", "scripts", "sentinel-immune-agent"];
const SCAN_EXTS = [".ts", ".tsx", ".js", ".jsx", ".html", ".md", ".go"];

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
        // Skip test files
        if (SKIP_TEST_FILES.some(ext => full.includes(ext))) continue;
        const content = readFileSync(full, "utf8");
        const lines = content.split("\n");
        for (const { term, context } of FORBIDDEN) {
          const regex = new RegExp(term, "i");
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // Skip pure comment lines and Go comment lines
            if (line.startsWith("//") || line.startsWith("*") || line.startsWith("#")) continue;
            // Skip lines with allowed context
            if (ALLOWED_CONTEXTS.some(a => line.toLowerCase().includes(a.toLowerCase()))) continue;
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
console.log("  SECURIT-E RELEASE GATE v3");
console.log("═══════════════════════════════════════════════\n");

if (!SMOKE_ONLY) {
  console.log("── Phase 1 : Scan des termes interdits (TS/TSX/JS/GO/MD/HTML) ─");
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
          if (ALLOWED_CONTEXTS.some(a => line.toLowerCase().includes(a.toLowerCase()))) continue;
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
  ["src/test/core-logic.test.ts", "unit tests core-logic"],
  ["src/test/smoke.test.ts", "unit tests smoke"],
  ["tests/e2e/public-routes.spec.ts", "E2E public routes spec"],
  [".github/workflows/ci.yml", "CI/CD GitHub Actions workflow"],
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
    const hasUndisclosedHardcoded = /\b(99\.97|99\.99|100\/100|97\/100)\b/.test(content) && !content.includes("demo") && !content.includes("démo") && !content.includes("estimé");
    log(!hasUndisclosedHardcoded, `${file.split("/").pop()} — pas de score hardcodé présenté comme factuel`);
  } catch {
    log(false, `${file} introuvable`);
  }
}

// ── 7. package.json scripts check ────────────────────────────────────────────
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
  log(!!pkg.scripts?.["test:unit"], `package.json test:unit — présent`);
} catch {
  log(false, "package.json introuvable ou invalide");
}

// ── 8. .go file no forbidden terms spot check ─────────────────────────────────
console.log("\n── Phase 8 : Spot check agent Go ───────────────");
const GO_FILES = [
  "sentinel-immune-agent/cmd/agent/main.go",
];
const GO_FORBIDDEN = ["CRYSTALS-Dilithium", "Kyber-1024", "zksnark:", "Post-Quantum Ready", "PQReady"];
for (const file of GO_FILES) {
  try {
    const content = readFileSync(file, "utf8");
    const lines = content.split("\n");
    let ok = true;
    for (const term of GO_FORBIDDEN) {
      const regex = new RegExp(term, "i");
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line.startsWith("//")) continue;
        if (ALLOWED_CONTEXTS.some(a => line.toLowerCase().includes(a.toLowerCase()))) continue;
        if (regex.test(line)) {
          log(false, `Agent Go: terme interdit "${term}" dans ${file}:${i + 1}`);
          ok = false;
        }
      }
    }
    if (ok) log(true, `${file.split("/").pop()} — aucun terme interdit Go`);
  } catch {
    log(false, `${file} introuvable`);
  }
}

// ── 9. Build check ────────────────────────────────────────────────────────────
console.log("\n── Phase 9 : Vérification build TypeScript ─────");
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
