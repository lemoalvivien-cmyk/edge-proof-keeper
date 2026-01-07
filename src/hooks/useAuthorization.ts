import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Authorization } from '@/types/database';

export function useAuthorization() {
  const { organization } = useAuth();

  const { data: authorizations, isLoading, refetch } = useQuery({
    queryKey: ['authorizations', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('authorizations')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Authorization[];
    },
    enabled: !!organization?.id,
  });

  const hasValidAuthorization = authorizations?.some(
    auth => auth.status === 'approved' && 
            auth.consent_checkbox && 
            (!auth.valid_until || new Date(auth.valid_until) > new Date())
  ) ?? false;

  // Get the default authorization ID (permanent or latest valid)
  const defaultAuthorizationId = authorizations?.find(
    auth => auth.status === 'approved' && 
            auth.consent_checkbox && 
            (!auth.valid_until || new Date(auth.valid_until) > new Date())
  )?.id ?? null;

  return {
    authorizations: authorizations ?? [],
    hasValidAuthorization,
    defaultAuthorizationId,
    isLoading,
    refetch,
  };
}
