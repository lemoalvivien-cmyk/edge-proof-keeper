import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function usePermanentAuthorization() {
  const { user, organization } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ensurePermanentAuthorization = useCallback(async (): Promise<string | null> => {
    if (!user?.id || !organization?.id) {
      return null;
    }

    setIsCreating(true);
    setError(null);

    try {
      const { data, error: rpcError } = await supabase.rpc('ensure_permanent_authorization', {
        _org_id: organization.id,
        _user_id: user.id,
      });

      if (rpcError) {
        console.error('Error ensuring permanent authorization:', rpcError);
        setError(rpcError.message);
        return null;
      }

      return data as string;
    } catch (err) {
      console.error('Error in ensurePermanentAuthorization:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [user?.id, organization?.id]);

  const getDefaultAuthorizationId = useCallback(async (): Promise<string | null> => {
    if (!organization?.id) {
      return null;
    }

    try {
      const { data, error: rpcError } = await supabase.rpc('get_default_authorization_id', {
        _org_id: organization.id,
      });

      if (rpcError) {
        console.error('Error getting default authorization:', rpcError);
        return null;
      }

      return data as string | null;
    } catch (err) {
      console.error('Error in getDefaultAuthorizationId:', err);
      return null;
    }
  }, [organization?.id]);

  return {
    ensurePermanentAuthorization,
    getDefaultAuthorizationId,
    isCreating,
    error,
  };
}
