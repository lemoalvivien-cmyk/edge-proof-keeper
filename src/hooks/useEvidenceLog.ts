import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { EvidenceLog } from '@/types/database';

interface LogEventParams {
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: Record<string, unknown>;
  artifact_hash?: string;
}

export function useEvidenceLog() {
  const { user, organization } = useAuth();

  const logEvent = useMutation({
    mutationFn: async (params: LogEventParams) => {
      if (!organization?.id) throw new Error('No organization');
      
      // Get client IP (approximation - actual IP captured server-side ideally)
      let ipAddress = 'unknown';
      try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        ipAddress = data.ip;
      } catch {
        // Fallback to unknown
      }
      
      const { error } = await supabase
        .from('evidence_log')
        .insert([{
          organization_id: organization.id,
          user_id: user?.id ?? null,
          action: params.action,
          entity_type: params.entity_type,
          entity_id: params.entity_id ?? null,
          details: params.details ? JSON.parse(JSON.stringify(params.details)) : null,
          ip_address: ipAddress,
          artifact_hash: params.artifact_hash ?? null,
        }]);
      
      if (error) throw error;
    },
  });

  const { data: logs, isLoading, refetch } = useQuery({
    queryKey: ['evidence_log', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('evidence_log')
        .select('*')
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as EvidenceLog[];
    },
    enabled: !!organization?.id,
  });

  return {
    logEvent: logEvent.mutateAsync,
    logs: logs ?? [],
    isLoading,
    refetch,
  };
}
