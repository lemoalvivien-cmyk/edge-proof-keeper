/**
 * SECURIT-E — Source de vérité BILLING unique
 * Toute copy liée à l'essai, au paiement ou à la facturation
 * DOIT consommer ces constantes. Aucun hardcode dispersé.
 *
 * Si TRIAL_REQUIRES_CARD est true, aucune surface publique
 * ne doit afficher "sans CB", "sans carte", ou "gratuit"
 * sans mentionner explicitement la carte requise.
 */

export const TRIAL_DAYS = 14;
export const TRIAL_REQUIRES_CARD = true;

/** How Stripe handles the trial period */
export const CHECKOUT_MODE = "subscription" as const;
export const STRIPE_MANAGED_TRIAL = true;

/** Cancellation terms */
export const CANCELLATION_POLICY = "Annulation libre à tout moment" as const;
export const REFUND_POLICY = "Satisfait ou remboursé 30j" as const;

/** ── Display copy (single source of truth) ── */
export const DISPLAY_COPY = {
  /** CTA button label */
  trialCta: `Essai ${TRIAL_DAYS}j gratuit · Carte requise`,
  /** Short inline mention */
  trialShort: `${TRIAL_DAYS}j gratuits · Carte requise`,
  /** Badge / chip */
  trialBadge: `${TRIAL_DAYS}j d'essai — carte requise — annulation libre`,
  /** Pricing sub-line */
  trialPricingNote: `${TRIAL_DAYS} jours gratuits inclus · Carte requise`,
  /** Footer link label */
  trialFooterLink: `Essai gratuit ${TRIAL_DAYS}j · Carte requise`,
  /** Full legal disclosure before Stripe redirect */
  trialDisclosure: `Essai gratuit de ${TRIAL_DAYS} jours. Carte bancaire requise à l'inscription. Vous ne serez débité qu'à J+${TRIAL_DAYS + 1}. ${CANCELLATION_POLICY}.`,
  /** Signup CTA (no "gratuit" without card mention) */
  signupCta: "Créer mon compte · Essai 14j inclus",
  /** Generic "start" CTA */
  startCta: "Démarrer l'essai · Carte requise",
  /** Stripe trust line */
  stripeTrust: `🔒 Stripe · ${REFUND_POLICY} · ${CANCELLATION_POLICY}`,
} as const;

/** Plans */
export const PLANS = {
  sentinel: { id: "starter", price: 490, label: "Sentinel" },
  command: { id: "pro", price: 6_900, label: "Command" },
  sovereign: { id: "sovereign", price: 29_900, label: "Sovereign" },
} as const;
