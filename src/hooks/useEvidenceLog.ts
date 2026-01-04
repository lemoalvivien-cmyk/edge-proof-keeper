import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { EvidenceLog } from '@/types/database';

// Note: Evidence log INSERT is now server-only (via edge functions)
// This hook only provides read access

export function useEvidenceLog() {
  const { organization } = useAuth();

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['evidence_log', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('evidence_log')
        .select('*')
        .eq('organization_id', organization.id)
        .order('seq', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as unknown as (EvidenceLog & {
        seq?: number;
        prev_hash?: string;
        entry_hash?: string;
        source?: string;
      })[];
    },
    enabled: !!organization?.id,
  });

  return {
    logs: logs ?? [],
    isLoading,
    refetch,
  };
}
