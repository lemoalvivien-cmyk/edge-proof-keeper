// SENTINEL EDGE - Application Configuration

/**
 * SOLO_MODE: When true, the app runs in single-user mode
 * - No visible /auth page
 * - Auto-session with stored credentials (email only, NOT password)
 * - One-time "Setup Owner" screen for initial setup
 * - Direct access to cockpit
 * 
 * SECURITY NOTE: We only store email for display purposes.
 * Password is NEVER stored in localStorage - we rely on Supabase session persistence.
 */
export const SOLO_MODE = true;

// Local storage keys for solo mode
// SECURITY: We intentionally do NOT store passwords in localStorage
export const SOLO_STORAGE_KEYS = {
  ownerEmail: 'sentinel_owner_email',
  ownerSetupComplete: 'sentinel_owner_setup_complete',
} as const;
