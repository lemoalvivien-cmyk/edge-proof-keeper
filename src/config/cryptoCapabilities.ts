/**
 * SECURIT-E — Capacités cryptographiques : source de vérité unique
 * Toute copy publique DOIT consommer ces constantes.
 */

// ── Ce qui est livré aujourd'hui ─────────────────────────────────────────────
export const CRYPTO_DELIVERED = {
  hashAlgorithm: "SHA-256" as const,
  standard: "NIST FIPS 180-4" as const,
  structure: "Merkle Chain (binary tree)" as const,
  api: "WebCrypto API (navigateur)" as const,
  signature: "SHA-256 HMAC déterministe" as const,
  immutability: "Chaîne de hashes enchaînés — toute modification invalide la suite" as const,
  verifiable: true,
  exportFormats: ["JSON", "PDF"] as const,
} as const;

export const CRYPTO_LABEL = "SHA-256 Merkle Chain" as const;
export const CRYPTO_BADGE = "SHA-256 Merkle Tree · NIST FIPS 180-4" as const;

// ── Ce qui n'est PAS livré ───────────────────────────────────────────────────
export const CRYPTO_NOT_DELIVERED = [
  "CRYSTALS-Dilithium (post-quantique)",
  "zk-SNARK / Groth16",
  "Kyber-1024",
  "SHA-3",
  "Signatures numériques qualifiées eIDAS",
] as const;

// ── Roadmap ──────────────────────────────────────────────────────────────────
export const CRYPTO_ROADMAP = [
  { feature: "Renforcement crypto avancé", target: "2027", status: "objectif" as const },
  { feature: "Signatures numériques qualifiées", target: "2027", status: "étude" as const },
] as const;

// ── Labels UI défendables ────────────────────────────────────────────────────
export const CRYPTO_UI = {
  proofLabel: "Preuve cryptographique SHA-256 vérifiable" as const,
  vaultLabel: "Evidence Vault · SHA-256 Merkle Chain" as const,
  exportLabel: "Preuve exportable JSON/PDF — vérifiable indépendamment" as const,
  footerNote: "SHA-256 Merkle Chain · Vérifiable · Hébergé en France" as const,
} as const;
