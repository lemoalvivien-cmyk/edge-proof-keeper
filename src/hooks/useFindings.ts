import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Finding, FindingStatus, FindingCounts, RiskLevel } from '@/types/findings';

export function useFindings(filters?: {
  severity?: RiskLevel;
  status?: FindingStatus;
  finding_type?: string;
}) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['findings', organization?.id, filters],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from('findings')
        .select(`
          *,
          tool_runs (
            id,
            mode,
            tools_catalog (
              name,
              slug
            )
          )
        `)
        .eq('organization_id', organization.id)
        .order('first_seen', { ascending: false });

      if (filters?.severity) {
        query = query.eq('severity', filters.severity);
      }
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.finding_type) {
        query = query.eq('finding_type', filters.finding_type);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as unknown as Finding[];
    },
    enabled: !!organization?.id,
  });
}

export function useFindingsByToolRun(toolRunId: string | undefined) {
  return useQuery({
    queryKey: ['findings-by-run', toolRunId],
    queryFn: async () => {
      if (!toolRunId) return [];

      const { data, error } = await supabase
        .from('findings')
        .select(`
          *,
          finding_control_links (
            id,
            framework,
            control_id,
            reason,
            compliance_controls (
              control_id,
              title,
              framework
            )
          )
        `)
        .eq('tool_run_id', toolRunId)
        .order('severity', { ascending: true });

      if (error) throw error;
      return data as unknown as Finding[];
    },
    enabled: !!toolRunId,
  });
}

export function useFindingCounts() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['finding-counts', organization?.id],
    queryFn: async (): Promise<FindingCounts> => {
      if (!organization?.id) {
        return { critical: 0, high: 0, medium: 0, low: 0, info: 0, total: 0 };
      }

      const { data, error } = await supabase
        .from('findings')
        .select('severity, status')
        .eq('organization_id', organization.id)
        .eq('status', 'open');

      if (error) throw error;

      const counts: FindingCounts = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        info: 0,
        total: data?.length || 0,
      };

      for (const finding of data || []) {
        const sev = finding.severity as RiskLevel;
        if (sev in counts) {
          counts[sev]++;
        }
      }

      return counts;
    },
    enabled: !!organization?.id,
  });
}

export function useTopPriorityFindings(limit = 5) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['top-findings', organization?.id, limit],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('findings')
        .select(`
          *,
          tool_runs (
            id,
            mode,
            tools_catalog (name, slug)
          )
        `)
        .eq('organization_id', organization.id)
        .eq('status', 'open')
        .in('severity', ['critical', 'high'])
        .order('severity', { ascending: true })
        .order('first_seen', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as unknown as Finding[];
    },
    enabled: !!organization?.id,
  });
}

export function useUpdateFindingStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ findingId, status }: { findingId: string; status: FindingStatus }) => {
      const { error } = await supabase
        .from('findings')
        .update({ status })
        .eq('id', findingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      queryClient.invalidateQueries({ queryKey: ['findings-by-run'] });
      queryClient.invalidateQueries({ queryKey: ['finding-counts'] });
      queryClient.invalidateQueries({ queryKey: ['top-findings'] });
    },
  });
}

export function useNormalizeToolRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tool_run_id: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/normalize-tool-run`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ tool_run_id }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Échec de la normalisation');
      }

      return response.json();
    },
    onSuccess: (_, toolRunId) => {
      queryClient.invalidateQueries({ queryKey: ['findings'] });
      queryClient.invalidateQueries({ queryKey: ['findings-by-run', toolRunId] });
      queryClient.invalidateQueries({ queryKey: ['finding-counts'] });
      queryClient.invalidateQueries({ queryKey: ['top-findings'] });
      queryClient.invalidateQueries({ queryKey: ['tool-run', toolRunId] });
    },
  });
}
