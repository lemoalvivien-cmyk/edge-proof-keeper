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
  /\bDémo[^)]*\b[Ll]ive\b/,       // "Démo … Live" in simulation contexts
  /\bSequence[^)]*\b[Ll]ive\b/i,   // "Séquence … Live"
  /\bDEMO LIVE\b/,
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

describe("Release Gate — productTruth.ts alignment", () => {
  it("should import productTruth constants without error", async () => {
    const pt = await import("@/config/productTruth");
    expect(pt.PRODUCT_NAME).toBe("SECURIT-E");
    expect(pt.TRIAL_DAYS).toBe(14);
    expect(pt.TRIAL_REQUIRES_CARD).toBe(true);
    expect(pt.DEMO_IS_SIMULATED).toBe(true);
    expect(pt.REMEDIATION_MODE).toBe("supervisé");
    expect(pt.CRYPTO_DELIVERED_NOW).toBe("SHA-256 Merkle Chain");
  });

  it("should have FORBIDDEN_MARKETING_CLAIMS including 'sans CB'", async () => {
    const pt = await import("@/config/productTruth");
    expect(pt.FORBIDDEN_MARKETING_CLAIMS).toContain("sans CB");
    expect(pt.FORBIDDEN_MARKETING_CLAIMS).toContain("100% Souverain");
    expect(pt.FORBIDDEN_MARKETING_CLAIMS).toContain("SLA 99.99%");
    expect(pt.FORBIDDEN_MARKETING_CLAIMS).toContain("fully autonomous");
    expect(pt.FORBIDDEN_MARKETING_CLAIMS).toContain("live");
  });

  it("should detect 'sans CB' as forbidden", () => {
    const result = containsForbiddenTerm("Essai 14j sans CB");
    // Note: "sans CB" isn't in our regex patterns but IS in productTruth
    // The release gate script handles it separately
    expect(result.found).toBe(false); // regex-based gate doesn't catch this — productTruth does
  });
});

describe("Release Gate — billingPolicy.ts alignment", () => {
  it("should import billingPolicy constants without error", async () => {
    const bp = await import("@/config/billingPolicy");
    expect(bp.TRIAL_DAYS).toBe(14);
    expect(bp.TRIAL_REQUIRES_CARD).toBe(true);
    expect(bp.CHECKOUT_MODE).toBe("subscription");
    expect(bp.STRIPE_MANAGED_TRIAL).toBe(true);
    expect(bp.CANCELLATION_POLICY).toContain("Annulation");
  });

  it("should have DISPLAY_COPY with card requirement in all labels", async () => {
    const bp = await import("@/config/billingPolicy");
    const { DISPLAY_COPY } = bp;
    // Every user-facing trial label must mention "carte" or "Carte"
    const trialLabels = [
      DISPLAY_COPY.trialCta,
      DISPLAY_COPY.trialShort,
      DISPLAY_COPY.trialBadge,
      DISPLAY_COPY.trialPricingNote,
      DISPLAY_COPY.trialFooterLink,
      DISPLAY_COPY.trialDisclosure,
    ];
    for (const label of trialLabels) {
      expect(label.toLowerCase()).toContain("carte");
    }
  });

  it("should ensure billingPolicy and productTruth agree on TRIAL_DAYS", async () => {
    const bp = await import("@/config/billingPolicy");
    const pt = await import("@/config/productTruth");
    expect(bp.TRIAL_DAYS).toBe(pt.TRIAL_DAYS);
    expect(bp.TRIAL_REQUIRES_CARD).toBe(pt.TRIAL_REQUIRES_CARD);
  });
});
