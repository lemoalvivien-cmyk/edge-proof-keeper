import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Risk, RemediationAction, RiskStatus } from '@/types/engine';

// ─── Risk Register ────────────────────────────────────────────────────────────

export function useRisks(filters?: {
  status?: RiskStatus;
  risk_level?: string;
  owner?: string;
}) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['risks', organization?.id, filters],
    queryFn: async () => {
      if (!organization?.id) return [];

      let q = supabase
        .from('risk_register')
        .select('*, assets:asset_id(name, asset_type, identifier)')
        .eq('organization_id', organization.id)
        .order('score', { ascending: false })
        .limit(200);

      if (filters?.status) q = q.eq('status', filters.status);
      if (filters?.risk_level) q = q.eq('risk_level', filters.risk_level);
      if (filters?.owner) q = q.eq('owner', filters.owner);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Risk[];
    },
    enabled: !!organization?.id,
  });
}

export function useRiskById(riskId?: string) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['risk', riskId],
    queryFn: async () => {
      if (!riskId || !organization?.id) return null;
      const { data, error } = await supabase
        .from('risk_register')
        .select('*, assets:asset_id(name, asset_type, identifier)')
        .eq('id', riskId)
        .eq('organization_id', organization.id)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as Risk | null;
    },
    enabled: !!riskId && !!organization?.id,
  });
}

export function useRiskCounts() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['risk-counts', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data, error } = await supabase
        .from('risk_register')
        .select('risk_level, status, score, due_date')
        .eq('organization_id', organization.id);
      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      const rows = data ?? [];
      const counts = {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
        total: rows.length,
        open: 0,
        overdue: 0,
        avg_score: 0,
      };

      let scoreSum = 0;
      for (const r of rows) {
        const lvl = r.risk_level as string;
        if (lvl in counts) (counts as Record<string, number>)[lvl]++;
        if (r.status === 'open' || r.status === 'in_treatment') counts.open++;
        if (r.due_date && r.due_date < today && (r.status === 'open' || r.status === 'in_treatment')) {
          counts.overdue++;
        }
        scoreSum += Number(r.score ?? 0);
      }
      counts.avg_score = rows.length > 0 ? Math.round(scoreSum / rows.length) : 0;
      return counts;
    },
    enabled: !!organization?.id,
  });
}

export function useUpdateRisk() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Risk> & { id: string }) => {
      const { data, error } = await supabase
        .from('risk_register')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['risks'] });
      qc.invalidateQueries({ queryKey: ['risk'] });
      qc.invalidateQueries({ queryKey: ['risk-counts'] });
    },
  });
}

// ─── Remediation Actions ──────────────────────────────────────────────────────

export function useRemediationActions(filters?: {
  status?: string;
  priority?: string;
  risk_id?: string;
}) {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['remediation-actions', organization?.id, filters],
    queryFn: async () => {
      if (!organization?.id) return [];

      let q = supabase
        .from('remediation_actions')
        .select('*, risk_register:risk_id(id, title, risk_level, score)')
        .eq('organization_id', organization.id)
        .order('priority', { ascending: true })
        .order('due_date', { ascending: true, nullsFirst: false })
        .limit(200);

      if (filters?.status) q = q.eq('status', filters.status);
      if (filters?.priority) q = q.eq('priority', filters.priority);
      if (filters?.risk_id) q = q.eq('risk_id', filters.risk_id);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as (RemediationAction & {
        risk_register?: { id: string; title: string; risk_level: string; score: number };
      })[];
    },
    enabled: !!organization?.id,
  });
}

export function useRemediationActionCounts() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ['remediation-action-counts', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data, error } = await supabase
        .from('remediation_actions')
        .select('status, priority, due_date')
        .eq('organization_id', organization.id);
      if (error) throw error;

      const today = new Date().toISOString().split('T')[0];
      const rows = data ?? [];
      const counts = {
        open: 0,
        in_progress: 0,
        done: 0,
        cancelled: 0,
        total: rows.length,
        overdue: 0,
        critical: 0,
        high: 0,
      };

      for (const r of rows) {
        const st = r.status as string;
        if (st in counts) (counts as Record<string, number>)[st]++;
        if (r.priority === 'critical') counts.critical++;
        if (r.priority === 'high') counts.high++;
        if (r.due_date && r.due_date < today && (r.status === 'open' || r.status === 'in_progress')) {
          counts.overdue++;
        }
      }
      return counts;
    },
    enabled: !!organization?.id,
  });
}

export function useUpdateRemediationAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<RemediationAction> & { id: string }) => {
      const { data, error } = await supabase
        .from('remediation_actions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['remediation-actions'] });
      qc.invalidateQueries({ queryKey: ['remediation-action-counts'] });
    },
  });
}
