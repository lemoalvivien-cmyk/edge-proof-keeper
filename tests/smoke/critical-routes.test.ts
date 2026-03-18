/**
 * SECURIT-E — Smoke tests (critical routes & component existence)
 * Run: bun test tests/smoke/
 * These are lightweight static checks — no browser, no network.
 */

import { existsSync } from "fs";
import { describe, it, expect } from "bun:test";

describe("Critical frontend pages exist", () => {
  const pages = [
    "src/pages/Dashboard.tsx",
    "src/pages/ExecutiveCockpit.tsx",
    "src/pages/Pricing.tsx",
    "src/pages/Status.tsx",
    "src/pages/Activate.tsx",
    "src/pages/AdminAccessCodes.tsx",
    "src/pages/Auth.tsx",
    "src/pages/FAQ.tsx",
    "src/pages/NotFound.tsx",
    "src/pages/Onboarding.tsx",
  ];

  for (const p of pages) {
    it(`${p} exists`, () => {
      expect(existsSync(p)).toBe(true);
    });
  }
});

describe("Critical components exist", () => {
  const components = [
    "src/components/auth/PaywallGate.tsx",
    "src/components/auth/ProtectedRoute.tsx",
    "src/components/auth/AccessCodeActivation.tsx",
    "src/components/ui/UpgradeWall.tsx",
    "src/components/ui/UpsellNudge.tsx",
    "src/components/dashboard/WowPanel.tsx",
    "src/components/landing/HeroSection.tsx",
    "src/components/landing/PricingSection.tsx",
    "src/components/ErrorBoundary.tsx",
  ];

  for (const c of components) {
    it(`${c} exists`, () => {
      expect(existsSync(c)).toBe(true);
    });
  }
});

describe("Critical Edge Functions exist", () => {
  const functions = [
    "supabase/functions/check-entitlement/index.ts",
    "supabase/functions/stripe-webhook/index.ts",
    "supabase/functions/create-checkout/index.ts",
    "supabase/functions/redeem-access-code/index.ts",
    "supabase/functions/export-proof-pack/index.ts",
    "supabase/functions/verify-evidence-chain/index.ts",
    "supabase/functions/log-evidence/index.ts",
    "supabase/functions/bootstrap-owner/index.ts",
    "supabase/functions/_shared/cors.ts",
  ];

  for (const f of functions) {
    it(`${f} exists`, () => {
      expect(existsSync(f)).toBe(true);
    });
  }
});

describe("No in-memory rate limiting in sensitive functions", () => {
  it("export-proof-pack uses DB-backed rate limiting", () => {
    const content = require("fs").readFileSync("supabase/functions/export-proof-pack/index.ts", "utf8");
    expect(content).toContain("check_rate_limit");
    expect(content).not.toContain("rateLimitMap = new Map");
  });

  it("verify-evidence-chain uses DB-backed rate limiting", () => {
    const content = require("fs").readFileSync("supabase/functions/verify-evidence-chain/index.ts", "utf8");
    expect(content).toContain("check_rate_limit");
    expect(content).not.toContain("rateLimitMap = new Map");
  });
});

describe("Forbidden claims not present in app code", () => {
  const { readFileSync, readdirSync, statSync } = require("fs");
  const { join, extname } = require("path");

  function scanFiles(dir: string, ext: string[]): string[] {
    const files: string[] = [];
    const skip = ["node_modules", ".git", "dist", "build"];
    try {
      for (const entry of readdirSync(dir)) {
        if (skip.some(s => entry.includes(s))) continue;
        const full = join(dir, entry);
        if (statSync(full).isDirectory()) files.push(...scanFiles(full, ext));
        else if (ext.includes(extname(full))) files.push(full);
      }
    } catch {}
    return files;
  }

  const allFiles = [
    ...scanFiles("src", [".ts", ".tsx"]),
    ...scanFiles("supabase/functions", [".ts"]),
  ];

  const FORBIDDEN_IN_UI = [
    "CRYSTALS-Dilithium",
    "zk-SNARK Groth16",
    "zksnark:",
    "certifié SecNumCloud",
    "Certifié SecNumCloud",
    "99.9% garanti contractuellement",
    "aucun ordinateur quantique",
  ];

  for (const term of FORBIDDEN_IN_UI) {
    it(`"${term}" absent du code non-commentaire`, () => {
      let occurrences = 0;
      for (const file of allFiles) {
        const lines = readFileSync(file, "utf8").split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith("//") || trimmed.startsWith("*")) continue;
          if (line.toLowerCase().includes(term.toLowerCase())) occurrences++;
        }
      }
      expect(occurrences).toBe(0);
    });
  }
});
