// WiinupMax - Application Configuration has been fully renamed to SECURIT-E FINAL

/**
 * SECURIT-E FINAL — Application Configuration
 *
 * SOLO_MODE: When true, the app runs in single-user private admin mode.
 * Set VITE_SOLO_MODE=true in .env to enable.
 * Default in production = false (public SaaS mode).
 */
export const SOLO_MODE = import.meta.env.VITE_SOLO_MODE === 'true';

// Local storage keys for solo mode
// SECURITY: We intentionally do NOT store passwords in localStorage
export const SOLO_STORAGE_KEYS = {
  ownerEmail: 'securite_owner_email',
  ownerSetupComplete: 'securite_owner_setup_complete',
} as const;

