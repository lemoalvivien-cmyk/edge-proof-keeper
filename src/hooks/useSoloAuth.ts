import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { SOLO_MODE, SOLO_STORAGE_KEYS } from '@/config/app';

type SoloAuthState = 'loading' | 'needs_setup' | 'authenticated';

export function useSoloAuth() {
  const [state, setState] = useState<SoloAuthState>('loading');

  const checkAndRestoreSession = useCallback(async () => {
    if (!SOLO_MODE) {
      setState('authenticated');
      return;
    }

    // Check if there's already a valid session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      setState('authenticated');
      return;
    }

    // Check if we have stored credentials
    const storedEmail = localStorage.getItem(SOLO_STORAGE_KEYS.ownerEmail);
    const storedPassword = localStorage.getItem(SOLO_STORAGE_KEYS.ownerPassword);
    const setupComplete = localStorage.getItem(SOLO_STORAGE_KEYS.ownerSetupComplete);

    if (storedEmail && storedPassword && setupComplete === 'true') {
      // Try to auto sign-in
      const { error } = await supabase.auth.signInWithPassword({
        email: storedEmail,
        password: storedPassword,
      });

      if (!error) {
        setState('authenticated');
        return;
      }
      
      // If auto sign-in failed, clear credentials and require setup
      localStorage.removeItem(SOLO_STORAGE_KEYS.ownerEmail);
      localStorage.removeItem(SOLO_STORAGE_KEYS.ownerPassword);
      localStorage.removeItem(SOLO_STORAGE_KEYS.ownerSetupComplete);
    }

    // No session, no valid credentials - need setup
    setState('needs_setup');
  }, []);

  useEffect(() => {
    checkAndRestoreSession();
  }, [checkAndRestoreSession]);

  const onSetupComplete = useCallback(() => {
    setState('authenticated');
  }, []);

  return {
    state,
    onSetupComplete,
    isSoloMode: SOLO_MODE,
  };
}
