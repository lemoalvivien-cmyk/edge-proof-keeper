// Remediation types for SENTINEL EDGE

export type TaskStatus = 'open' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface RemediationTask {
  id: string;
  organization_id: string;
  finding_id: string | null;
  title: string;
  description: string | null;
  priority: RiskLevel;
  status: TaskStatus;
  owner_id: string | null;
  due_date: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  // Joined fields
  findings?: {
    id: string;
    title: string;
    severity: RiskLevel;
    status: string;
  };
  owner?: {
    id: string;
    email: string;
    full_name: string | null;
  };
  creator?: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

export interface TaskComment {
  id: string;
  organization_id: string;
  task_id: string;
  author_id: string;
  body: string;
  created_at: string;
  // Joined fields
  author?: {
    id: string;
    email: string;
    full_name: string | null;
  };
}

export interface TaskCounts {
  open: number;
  in_progress: number;
  blocked: number;
  done: number;
  cancelled: number;
  total: number;
  overdue: number;
}
