import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tool, ToolRun, ToolPreset, ToolRunMode } from '@/types/tools';

export function useToolsCatalog() {
  return useQuery({
    queryKey: ['tools-catalog'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tools_catalog')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });
      
      if (error) throw error;
      return data as Tool[];
    },
  });
}

export function useToolBySlug(slug: string) {
  return useQuery({
    queryKey: ['tool', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tools_catalog')
        .select('*')
        .eq('slug', slug)
        .single();
      
      if (error) throw error;
      return data as Tool;
    },
    enabled: !!slug,
  });
}

export function useToolPresets(toolId: string | undefined) {
  return useQuery({
    queryKey: ['tool-presets', toolId],
    queryFn: async () => {
      if (!toolId) return [];
      const { data, error } = await supabase
        .from('tool_presets')
        .select('*')
        .eq('tool_id', toolId)
        .order('name');
      
      if (error) throw error;
      return data as ToolPreset[];
    },
    enabled: !!toolId,
  });
}

export function useToolRuns() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['tool-runs', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from('tool_runs')
        .select(`
          *,
          tools_catalog (
            id,
            slug,
            name,
            category
          )
        `)
        .eq('organization_id', organization.id)
        .order('requested_at', { ascending: false });
      
      if (error) throw error;
      return data as unknown as ToolRun[];
    },
    enabled: !!organization?.id,
  });
}

export function useToolRun(runId: string | undefined) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['tool-run', runId],
    queryFn: async () => {
      if (!runId || !organization?.id) return null;
      
      const { data, error } = await supabase
        .from('tool_runs')
        .select(`
          *,
          tools_catalog (
            id,
            slug,
            name,
            category,
            official_site_url,
            repo_url,
            docs_url
          )
        `)
        .eq('id', runId)
        .eq('organization_id', organization.id)
        .single();
      
      if (error) throw error;
      return data as unknown as ToolRun;
    },
    enabled: !!runId && !!organization?.id,
  });
}

export function useCreateToolRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organization_id,
      asset_id,
      authorization_id,
      tool_slug,
      mode,
    }: {
      organization_id: string;
      asset_id?: string;
      authorization_id: string;
      tool_slug: string;
      mode: ToolRunMode;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('create-tool-run', {
        body: {
          organization_id,
          asset_id,
          authorization_id,
          tool_slug,
          mode,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to create tool run');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tool-runs'] });
    },
  });
}

export function useUploadToolRunArtifact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      tool_run_id,
      file,
    }: {
      tool_run_id: string;
      file: File;
    }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('tool_run_id', tool_run_id);
      formData.append('file', file);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-tool-run-artifact`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload artifact');
      }

      return response.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tool-runs'] });
      queryClient.invalidateQueries({ queryKey: ['tool-run', variables.tool_run_id] });
    },
  });
}
