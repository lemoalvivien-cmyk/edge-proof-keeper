import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Report } from '@/types/reports';

export function useReports() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['reports', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];

      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          tool_runs (
            id,
            mode,
            status,
            tools_catalog (
              name,
              slug
            )
          )
        `)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as Report[];
    },
    enabled: !!organization?.id,
  });
}

export function useReport(reportId: string | undefined) {
  return useQuery({
    queryKey: ['report', reportId],
    queryFn: async () => {
      if (!reportId) return null;

      const { data, error } = await supabase
        .from('reports')
        .select(`
          *,
          tool_runs (
            id,
            mode,
            status,
            tools_catalog (
              name,
              slug
            )
          )
        `)
        .eq('id', reportId)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as Report | null;
    },
    enabled: !!reportId,
  });
}

export function useReportByToolRun(toolRunId: string | undefined) {
  return useQuery({
    queryKey: ['report-by-run', toolRunId],
    queryFn: async () => {
      if (!toolRunId) return null;

      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('tool_run_id', toolRunId)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as Report | null;
    },
    enabled: !!toolRunId,
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tool_run_id: string) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-reports`,
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
        if (response.status === 429) {
          throw new Error('Limite de requêtes atteinte, veuillez réessayer plus tard');
        }
        if (response.status === 402) {
          throw new Error('Crédits IA épuisés');
        }
        throw new Error(error.error || 'Échec de la génération du rapport');
      }

      return response.json();
    },
    onSuccess: (_, toolRunId) => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['report-by-run', toolRunId] });
    },
  });
}
