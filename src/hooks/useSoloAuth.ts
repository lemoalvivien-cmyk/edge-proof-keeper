import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SOLO_MODE, SOLO_STORAGE_KEYS } from '@/config/app';

type SoloAuthState = 'loading' | 'needs_setup' | 'authenticated';

/**
 * Hook for Solo Mode authentication.
 * 
 * SECURITY: We do NOT store passwords in localStorage.
 * We rely on Supabase's built-in session persistence (localStorage tokens are encrypted by Supabase).
 * If the session expires, user will need to re-authenticate via the OwnerSetup screen.
 */
export function useSoloAuth() {
  const [state, setState] = useState<SoloAuthState>('loading');

  const checkSession = useCallback(async () => {
    if (!SOLO_MODE) {
      setState('authenticated');
      return;
    }

    // Check if there's already a valid Supabase session
    // Supabase handles session persistence securely via its own mechanism
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // Mark setup as complete if we have a session
      localStorage.setItem(SOLO_STORAGE_KEYS.ownerSetupComplete, 'true');
      setState('authenticated');
      return;
    }

    // Check if setup was previously completed
    const setupComplete = localStorage.getItem(SOLO_STORAGE_KEYS.ownerSetupComplete);
    
    if (setupComplete === 'true') {
      // Setup was done before but session expired
      // User needs to re-authenticate
      // Clear the flag so they go through setup again
      localStorage.removeItem(SOLO_STORAGE_KEYS.ownerSetupComplete);
      localStorage.removeItem(SOLO_STORAGE_KEYS.ownerEmail);
    }

    // No valid session - need setup
    setState('needs_setup');
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const onSetupComplete = useCallback(() => {
    setState('authenticated');
  }, []);

  return {
    state,
    onSetupComplete,
    isSoloMode: SOLO_MODE,
  };
}
