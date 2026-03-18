/**
 * Tests unitaires — Release Gate Logic
 * Vérifie que le release gate détecte correctement les termes interdits
 */
import { describe, it, expect } from "vitest";

// ── Forbidden term detection logic (mirrors release-gate.mjs) ──────────────
const FORBIDDEN_PATTERNS = [
  /CRYSTALS-Dilithium/i,
  /zk-SNARK/i,
  /Kyber-1024/i,
  /fully autonomous/i,
  /100% autonome/i,
  /certifié SecNumCloud/i,
  /SLA 99\.99%.*garantie/i,
  /ROI garanti/i,
  /20 ans d'avance/i,
  /"97\/100"/,
  /"99\/100"/,
  /"100\/100"/,
];

function containsForbiddenTerm(content: string): { found: boolean; term?: string } {
  for (const pattern of FORBIDDEN_PATTERNS) {
    if (pattern.test(content)) {
      return { found: true, term: pattern.toString() };
    }
  }
  return { found: false };
}

describe("Release Gate — Forbidden Terms Detection", () => {
  it("should detect CRYSTALS-Dilithium", () => {
    const result = containsForbiddenTerm("Using CRYSTALS-Dilithium for signing");
    expect(result.found).toBe(true);
  });

  it("should detect zk-SNARK", () => {
    const result = containsForbiddenTerm("zk-SNARK proof system");
    expect(result.found).toBe(true);
  });

  it("should detect fully autonomous", () => {
    const result = containsForbiddenTerm("The agent is fully autonomous");
    expect(result.found).toBe(true);
  });

  it("should NOT flag SHA-256 Merkle Chain", () => {
    const result = containsForbiddenTerm("SHA-256 Merkle Chain — preuves immuables");
    expect(result.found).toBe(false);
  });

  it("should NOT flag supervised delegation", () => {
    const result = containsForbiddenTerm("Délégation supervisée avec validation Go/No-Go");
    expect(result.found).toBe(false);
  });

  it("should NOT flag SecNumCloud roadmap (allowed context)", () => {
    // This is fine — the gate only blocks "certifié SecNumCloud"
    const result = containsForbiddenTerm("SecNumCloud objectif roadmap 2026");
    expect(result.found).toBe(false);
  });

  it("should detect hardcoded 97/100 score in code", () => {
    const result = containsForbiddenTerm('score = "97/100"');
    expect(result.found).toBe(true);
  });

  it("should NOT flag dynamic score calculations", () => {
    const result = containsForbiddenTerm("const score = Math.max(10, 100 - penalty)");
    expect(result.found).toBe(false);
  });
});

describe("Release Gate — Clean marketing copy (current state)", () => {
  const marketingClaims = [
    "47 secondes (démontré en conditions de laboratoire contrôlées)",
    "6 agents supervisés IA",
    "SHA-256 Merkle Chain",
    "Délégation supervisée",
    "SecNumCloud objectif roadmap 2026",
    "ROI estimé (base : coût moyen incident cyber)",
    "SLA < 4h (cible contractuelle selon offre)",
  ];

  marketingClaims.forEach((claim) => {
    it(`should allow clean claim: "${claim.substring(0, 50)}"`, () => {
      const result = containsForbiddenTerm(claim);
      expect(result.found).toBe(false);
    });
  });
});
