// SENTINEL EDGE - Application Configuration

/**
 * SOLO_MODE: When true, the app runs in single-user mode
 * - No visible /auth page
 * - Auto-session with stored credentials
 * - One-time "Setup Owner" screen for initial setup
 * - Direct access to cockpit
 */
export const SOLO_MODE = true;

// Local storage keys for solo mode
export const SOLO_STORAGE_KEYS = {
  ownerEmail: 'sentinel_owner_email',
  ownerPassword: 'sentinel_owner_password',
  ownerSetupComplete: 'sentinel_owner_setup_complete',
} as const;
