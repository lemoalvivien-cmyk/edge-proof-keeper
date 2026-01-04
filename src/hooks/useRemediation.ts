import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { RemediationTask, TaskComment, TaskCounts, TaskStatus, RiskLevel } from '@/types/remediation';

export function useRemediationTasks(filters?: { 
  status?: TaskStatus; 
  priority?: RiskLevel;
  owner_id?: string;
  overdue?: boolean;
}) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['remediation-tasks', organization?.id, filters],
    queryFn: async () => {
      if (!organization?.id) return [];

      let query = supabase
        .from('remediation_tasks')
        .select(`
          *,
          findings (id, title, severity, status),
          owner:profiles!remediation_tasks_owner_id_fkey (id, email, full_name),
          creator:profiles!remediation_tasks_created_by_fkey (id, email, full_name)
        `)
        .eq('organization_id', organization.id)
        .order('priority', { ascending: true })
        .order('due_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.priority) {
        query = query.eq('priority', filters.priority);
      }
      if (filters?.owner_id) {
        query = query.eq('owner_id', filters.owner_id);
      }
      if (filters?.overdue) {
        query = query.lt('due_date', new Date().toISOString().split('T')[0])
          .in('status', ['open', 'in_progress', 'blocked']);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as RemediationTask[];
    },
    enabled: !!organization?.id,
  });
}

export function useRemediationTask(id?: string) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['remediation-task', id],
    queryFn: async () => {
      if (!id || !organization?.id) return null;

      const { data, error } = await supabase
        .from('remediation_tasks')
        .select(`
          *,
          findings (id, title, severity, status, tool_run_id),
          owner:profiles!remediation_tasks_owner_id_fkey (id, email, full_name),
          creator:profiles!remediation_tasks_created_by_fkey (id, email, full_name)
        `)
        .eq('id', id)
        .eq('organization_id', organization.id)
        .single();

      if (error) throw error;
      return data as unknown as RemediationTask;
    },
    enabled: !!id && !!organization?.id,
  });
}

export function useTaskComments(taskId?: string) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['task-comments', taskId],
    queryFn: async () => {
      if (!taskId || !organization?.id) return [];

      const { data, error } = await supabase
        .from('task_comments')
        .select(`
          *,
          author:profiles!task_comments_author_id_fkey (id, email, full_name)
        `)
        .eq('task_id', taskId)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as unknown as TaskComment[];
    },
    enabled: !!taskId && !!organization?.id,
  });
}

export function useTaskCounts() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['task-counts', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;

      const { data, error } = await supabase
        .from('remediation_tasks')
        .select('status, due_date')
        .eq('organization_id', organization.id);

      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      const counts: TaskCounts = {
        open: 0,
        in_progress: 0,
        blocked: 0,
        done: 0,
        cancelled: 0,
        total: data.length,
        overdue: 0,
      };

      for (const task of data) {
        const status = task.status as TaskStatus;
        if (status in counts) {
          counts[status]++;
        }
        if (task.due_date && task.due_date < today && 
            ['open', 'in_progress', 'blocked'].includes(task.status)) {
          counts.overdue++;
        }
      }

      return counts;
    },
    enabled: !!organization?.id,
  });
}

export function useTasksByFinding(findingId?: string) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['tasks-by-finding', findingId],
    queryFn: async () => {
      if (!findingId || !organization?.id) return [];

      const { data, error } = await supabase
        .from('remediation_tasks')
        .select('id, title, status, priority, due_date')
        .eq('finding_id', findingId)
        .eq('organization_id', organization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!findingId && !!organization?.id,
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const { user, organization } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      priority?: RiskLevel;
      finding_id?: string;
      owner_id?: string;
      due_date?: string;
    }) => {
      if (!organization?.id || !user?.id) throw new Error('Not authenticated');

      const { data: task, error } = await supabase
        .from('remediation_tasks')
        .insert({
          organization_id: organization.id,
          created_by: user.id,
          title: data.title,
          description: data.description || null,
          priority: data.priority || 'medium',
          finding_id: data.finding_id || null,
          owner_id: data.owner_id || null,
          due_date: data.due_date || null,
        })
        .select()
        .single();

      if (error) throw error;
      return task;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['remediation-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-counts'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-by-finding'] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      status,
      ...otherUpdates 
    }: { 
      id: string; 
      status?: TaskStatus;
      title?: string;
      description?: string;
      priority?: RiskLevel;
      owner_id?: string | null;
      due_date?: string | null;
    }) => {
      const updateData: Record<string, unknown> = { ...otherUpdates };
      
      if (status) {
        updateData.status = status;
        // Set closed_at when task is done or cancelled
        if (status === 'done' || status === 'cancelled') {
          updateData.closed_at = new Date().toISOString();
        } else {
          updateData.closed_at = null;
        }
      }

      const { data, error } = await supabase
        .from('remediation_tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['remediation-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['remediation-task', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['task-counts'] });
    },
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  const { user, organization } = useAuth();

  return useMutation({
    mutationFn: async ({ task_id, body }: { task_id: string; body: string }) => {
      if (!organization?.id || !user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('task_comments')
        .insert({
          organization_id: organization.id,
          task_id,
          author_id: user.id,
          body,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['task-comments', variables.task_id] });
    },
  });
}
