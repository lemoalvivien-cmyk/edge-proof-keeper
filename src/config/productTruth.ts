/**
 * SECURIT-E — Source de vérité produit unique
 * Toute copy publique DOIT consommer ces constantes.
 * Aucun hardcode dispersé.
 */

export const PRODUCT_NAME = "SECURIT-E" as const;
export const PRODUCT_TAGLINE = "Centre de commandement cyber assisté par IA" as const;

// ── Démo ──────────────────────────────────────────────────────────
export const DEMO_MODE_LABEL = "Simulation sécurisée" as const;
export const DEMO_IS_SIMULATED = true;
export const DEMO_CYCLE_LABEL = "47s (mesuré en conditions de laboratoire contrôlées)" as const;
export const DEMO_NAV_LABEL = "Démo interactive" as const;

// ── Essai ─────────────────────────────────────────────────────────
export const TRIAL_DAYS = 14;
export const TRIAL_REQUIRES_CARD = true;
export const TRIAL_CTA_LABEL = `Essai ${TRIAL_DAYS}j gratuit` as const;
export const TRIAL_DISCLAIMER = "Carte bancaire requise · Annulation libre" as const;

// ── Remédiation & autonomie ───────────────────────────────────────
export const REMEDIATION_MODE = "supervisé" as const;
export const AUTONOMY_LABEL = "Assisté par IA · Supervision humaine Go/No-Go" as const;
export const SELF_HEALING_LABEL = "Remédiation assistée · Objectif < 4h" as const;

// ── Cryptographie ─────────────────────────────────────────────────
export const CRYPTO_DELIVERED_NOW = "SHA-256 Merkle Chain" as const;
export const CRYPTO_ROADMAP = "Renforcement crypto : objectif roadmap 2027" as const;

// ── Souveraineté ──────────────────────────────────────────────────
export const SOVEREIGNTY_LABEL = "Hébergé en France 🇫🇷" as const;
export const SOVEREIGNTY_LONG = "Hébergement France · Données sous juridiction française · RGPD natif" as const;
export const SECNUMCLOUD_STATUS = "SecNumCloud : objectif roadmap 2026" as const;

// ── SLA ───────────────────────────────────────────────────────────
export const SLA_COMMAND = "Objectif < 4h remédiation (cible selon offre)" as const;
export const SLA_SOVEREIGN = "SLA renforcé · Contractualisé sur devis Enterprise" as const;

// ── Claims autorisées ─────────────────────────────────────────────
export const ALLOWED_MARKETING_CLAIMS = [
  "6 agents IA supervisés",
  "SHA-256 Merkle Chain",
  "Hébergé en France",
  "Support NIS2 documenté",
  "RGPD natif",
  "Supervision humaine Go/No-Go",
  "47 secondes (conditions de laboratoire)",
  "Evidence Vault",
  "Preuves cryptographiquement vérifiables",
  "Délégation supervisée",
  "ROI estimé (base : coût moyen incident cyber)",
  "Essai 14j gratuit — carte requise, annulation libre",
] as const;

// ── Claims interdites ─────────────────────────────────────────────
export const FORBIDDEN_MARKETING_CLAIMS = [
  "fully autonomous",
  "100% autonome",
  "autonome" ,       // sauf dans "délégation supervisée" ou roadmap
  "sans CB",
  "sans carte",
  "live",            // sauf "live · simulation" explicite
  "post-quantique",
  "zk-SNARK",
  "CRYSTALS-Dilithium",
  "Kyber-1024",
  "certifié SecNumCloud",
  "souveraineté totale",
  "SLA garanti",
  "SLA 99.99%",
  "ROI garanti",
  "opposable en toute circonstance",
  "zéro équipe",
  "zéro intervention humaine",
  "hébergement certifié",
  "100% Souverain",
] as const;
