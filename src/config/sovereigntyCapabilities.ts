/**
 * SECURIT-E — Capacités souveraineté : source de vérité unique
 * Toute copy publique DOIT consommer ces constantes.
 */

// ── Ce qui est livré aujourd'hui ─────────────────────────────────────────────
export const SOVEREIGNTY_DELIVERED = {
  hosting: "France (région EU-West Paris)" as const,
  jurisdiction: "Juridiction française" as const,
  dataResidency: "Données hébergées en France" as const,
  encryption: {
    atRest: "AES-256" as const,
    inTransit: "TLS 1.3" as const,
  },
  rgpd: "Conforme RGPD — Privacy by Design" as const,
  dataExport: "Aucun transfert hors UE déclaré" as const,
} as const;

// ── Ce qui n'est PAS prouvé / obtenu ─────────────────────────────────────────
export const SOVEREIGNTY_NOT_PROVEN = [
  "Certification SecNumCloud",
  "Qualification ANSSI / CSPN",
  "Hébergeur certifié HDS",
  "Souveraineté totale (terme marketing non défini)",
  "100% souverain (claim absolu)",
] as const;

// ── Roadmap ──────────────────────────────────────────────────────────────────
export const SOVEREIGNTY_ROADMAP = [
  { feature: "SecNumCloud", target: "2026", status: "objectif roadmap" as const },
  { feature: "Certification ANSSI / CSPN", target: "2026", status: "démarches en cours" as const },
] as const;

// ── Conformité — ce que le produit fait réellement ───────────────────────────
export const COMPLIANCE_DELIVERED = {
  nis2: {
    label: "Support conformité NIS2" as const,
    reality: "Aide documentaire · Preuves structurées · Support à l'audit" as const,
    notGuaranteed: "Acceptation automatique par les autorités" as const,
    disclaimer: "Le caractère opposable dépend de votre contexte juridique" as const,
  },
  rgpd: {
    label: "Conformité RGPD documentée" as const,
    reality: "Privacy by Design · Notification violations · DPIA assisté" as const,
    notGuaranteed: "Couverture exhaustive de tous les articles RGPD" as const,
  },
  dora: {
    label: "Support DORA" as const,
    reality: "Résilience opérationnelle documentée" as const,
    notGuaranteed: "Certification DORA" as const,
  },
} as const;

// ── Labels UI défendables ────────────────────────────────────────────────────
export const SOVEREIGNTY_UI = {
  badge: "Hébergé en France 🇫🇷" as const,
  short: "Hébergement France · RGPD natif" as const,
  long: "Hébergé en France · Juridiction française · RGPD natif" as const,
  nis2Badge: "Support NIS2" as const,
  complianceNote: "Aide à la conformité — non une garantie d'acceptation" as const,
} as const;
