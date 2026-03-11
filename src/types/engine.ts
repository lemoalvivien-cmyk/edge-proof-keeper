/**
 * CYBER SERENITY — Core Engine TypeScript Types
 *
 * Consumed by front-end pages/hooks to interface with the production engine.
 * These types mirror the DB schema + Edge Function responses exactly.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low';
export type Priority = 'critical' | 'high' | 'medium' | 'low';

export type SourceStatus = 'not_configured' | 'active' | 'error' | 'disabled';
export type SourceType = 'upload' | 'api' | 'manual' | 'import';
export type SourceCategory = 'vulnerability' | 'asset' | 'compliance' | 'threat';

export type SyncRunStatus = 'pending' | 'running' | 'completed' | 'failed';

export type SignalStatus = 'new' | 'acknowledged' | 'correlated' | 'closed';
export type SignalType =
  | 'vulnerability'
  | 'misconfiguration'
  | 'exposure'
  | 'threat'
  | 'compliance';

export type RiskStatus = 'open' | 'in_treatment' | 'accepted' | 'closed';
export type ActionStatus = 'open' | 'in_progress' | 'done' | 'cancelled';
export type ActionType = 'patch' | 'config' | 'process' | 'monitoring' | 'accept';

export type AnalysisType =
  | 'technical_analysis'
  | 'remediation_plan'
  | 'correlation'
  | 'summary';

// ─── Data Source ──────────────────────────────────────────────────────────────

export interface DataSource {
  id: string;
  organization_id: string;
  name: string;
  source_type: SourceType;
  category: SourceCategory;
  status: SourceStatus;
  config: Record<string, unknown>;
  last_sync_at: string | null;
  confidence_score: number | null;
  created_at: string;
  updated_at: string;
}

// ─── Source Sync Run ──────────────────────────────────────────────────────────

export interface SourceSyncRun {
  id: string;
  organization_id: string;
  source_id: string;
  status: SyncRunStatus;
  started_at: string;
  completed_at: string | null;
  items_received: number;
  items_normalized: number;
  error_message: string | null;
  raw_summary: Record<string, unknown>;
  created_at: string;
}

// ─── Signal ───────────────────────────────────────────────────────────────────

export interface Signal {
  id: string;
  organization_id: string;
  source_id: string;
  asset_id: string | null;
  signal_type: SignalType | string;
  category: string;
  title: string;
  description: string;
  severity: Severity;
  confidence_score: number | null;
  evidence: Record<string, unknown>;
  signal_refs: unknown[];
  detected_at: string;
  status: SignalStatus;
  dedupe_key: string | null;
  raw_payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined
  data_sources?: {
    name: string;
    source_type: string;
    category: string;
  };
  assets?: {
    name: string;
    asset_type: string;
    identifier: string | null;
  };
}

// ─── Risk Register ────────────────────────────────────────────────────────────

export interface Risk {
  id: string;
  organization_id: string;
  asset_id: string | null;
  title: string;
  description: string;
  risk_level: RiskLevel;
  score: number;
  business_impact: string;
  technical_impact: string;
  status: RiskStatus;
  owner: string | null;
  due_date: string | null;
  source_signal_ids: string[];
  created_at: string;
  updated_at: string;
  // Joined
  assets?: {
    name: string;
    asset_type: string;
    identifier: string | null;
  };
}

// ─── Remediation Action ───────────────────────────────────────────────────────

export interface RemediationAction {
  id: string;
  organization_id: string;
  risk_id: string;
  title: string;
  action_type: ActionType;
  priority: Priority;
  status: ActionStatus;
  owner: string | null;
  due_date: string | null;
  expected_gain: string;
  implementation_notes: string;
  created_at: string;
  updated_at: string;
}

// ─── AI Analysis ──────────────────────────────────────────────────────────────

export interface AiAnalysis {
  id: string;
  organization_id: string;
  entity_type: string;
  entity_id: string;
  model_name: string;
  analysis_type: AnalysisType;
  prompt_version: string;
  input_fact_pack: Record<string, unknown>;
  output_json: Record<string, unknown>;
  created_at: string;
}

// ─── AI Output shapes ─────────────────────────────────────────────────────────

export interface TechnicalAnalysisOutput {
  explanation: string;
  confidence_assessment: string;
  probable_impact: string;
  recommended_actions: string[];
  limitations: string;
}

export interface RemediationActionOutput {
  title: string;
  action_type: ActionType;
  priority: Priority;
  expected_gain: string;
  implementation_notes: string;
  estimated_effort: string;
}

export interface RemediationPlanOutput {
  summary: string;
  actions: RemediationActionOutput[];
  business_rationale: string;
  limitations: string;
}

// ─── Platform Health ──────────────────────────────────────────────────────────

export interface PlatformHealthStatus {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  components: {
    database: { status: 'ok' | 'error' };
    ai_gateway: { status: 'configured' | 'not_configured' };
    tables: {
      status: 'ok' | 'incomplete';
      detail: Record<string, boolean>;
    };
  };
  org_counts?: {
    active_sources: number;
    open_signals: number;
    open_risks: number;
    pending_actions: number;
  };
}

// ─── Ingest Signals ───────────────────────────────────────────────────────────

export interface SignalInput {
  signal_type: string;
  category: string;
  title: string;
  description?: string;
  severity?: Severity | string;
  confidence_score?: number;
  evidence?: Record<string, unknown>;
  signal_refs?: unknown[];
  detected_at?: string;
  dedupe_key?: string;
  raw_payload?: Record<string, unknown>;
  asset_id?: string;
}

export interface IngestSignalsResult {
  success: boolean;
  sync_run_id: string;
  received: number;
  inserted: number;
  skipped: number;
  error: string | null;
}

export interface CorrelateRisksResult {
  success: boolean;
  signals_processed: number;
  risks_created: number;
  risks_updated: number;
  message?: string;
}

export interface AnalyzeSignalResult {
  success: boolean;
  analysis_id: string;
  signal_id: string;
  analysis: TechnicalAnalysisOutput;
}

export interface GenerateRemediationPlanResult {
  success: boolean;
  risk_id: string;
  analysis_id: string | null;
  actions_created: number;
  plan: {
    summary: string;
    business_rationale: string;
    limitations: string;
    actions: RemediationActionOutput[];
  };
}
