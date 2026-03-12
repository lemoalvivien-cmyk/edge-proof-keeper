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
export type SourceType = 'upload' | 'api' | 'manual' | 'import' | 'public_intel' | 'customer_authorized';
export type SourceCategory = 'vulnerability' | 'asset' | 'compliance' | 'threat' | 'exposure' | 'brand';

export type SyncRunStatus = 'pending' | 'running' | 'completed' | 'failed';

export type SignalStatus = 'new' | 'open' | 'acknowledged' | 'correlated' | 'ignored' | 'resolved' | 'closed';
export type SignalType =
  | 'vulnerability'
  | 'misconfiguration'
  | 'exposure'
  | 'threat'
  | 'compliance'
  | 'exposed_asset'
  | 'cert_transparency'
  | 'dns_record'
  | 'cve'
  | 'brand_impersonation'
  | 'repo_exposure';

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
  source_type: SourceType | string;
  category: SourceCategory | string;
  status: SourceStatus;
  config: Record<string, unknown>;
  last_sync_at: string | null;
  confidence_score: number | null;
  created_at: string;
  updated_at: string;
  // Computed from joins
  signal_count?: number;
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
  asset_id?: string | null;
  signal_type: SignalType | string;
  category: string;
  title: string;
  description: string;
  severity: Severity;
  confidence_score?: number | null;
  evidence: Record<string, unknown>;
  references: unknown[];
  detected_at: string;
  status: SignalStatus;
  dedupe_key?: string | null;
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
  references?: unknown[];
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
  errors_count?: number;
  message?: string;
}

export interface BuildRemediationQueueResult {
  success: boolean;
  risks_processed: number;
  actions_created: number;
  actions_updated: number;
  errors_count: number;
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

// ─── Source Payload Ingestion ─────────────────────────────────────────────────

export interface SourcePayloadItem {
  signal_type: string;
  category: string;
  title: string;
  description?: string;
  severity?: Severity | string;
  confidence_score?: number;
  evidence?: Record<string, unknown>;
  references?: string[];
  asset_id?: string | null;
  detected_at?: string;
  raw_payload?: Record<string, unknown>;
}

export interface IngestSourcePayloadInput {
  source_id: string;
  items: SourcePayloadItem[];
}

export interface IngestSourcePayloadResult {
  success: boolean;
  sync_run_id: string;
  source_id: string;
  received: number;
  inserted: number;
  skipped_duplicates: number;
  failed: number;
  error: string | null;
}

// ─── Public Intel Sync ────────────────────────────────────────────────────────

export type ProviderStatus =
  | 'ok'
  | 'not_configured'
  | 'unsupported_provider'
  | 'missing_api_key'
  | 'error';

export interface SyncPublicIntelResult {
  success: boolean;
  source_id: string;
  provider: string;
  provider_status: ProviderStatus;
  sync_run_id: string | null;
  signals_ingested: number;
  message: string;
}

export interface SyncCustomerAuthorizedResult {
  success: boolean;
  source_id: string;
  sync_run_id: string;
  received: number;
  inserted: number;
  skipped_duplicates: number;
  error: string | null;
}

// ─── Entity Graph ─────────────────────────────────────────────────────────────

export type EntityType =
  | 'domain'
  | 'subdomain'
  | 'ip'
  | 'certificate'
  | 'email'
  | 'brand'
  | 'repository'
  | 'cloud_asset'
  | 'organization_marker';

export type EdgeType =
  | 'resolves_to'
  | 'shares_certificate'
  | 'belongs_to'
  | 'mentions_brand'
  | 'linked_to_breach'
  | 'hosted_on'
  | 'reuses_identity_signal';

export interface EntityNode {
  id: string;
  organization_id: string;
  entity_type: EntityType;
  canonical_value: string;
  display_value: string;
  metadata: Record<string, unknown>;
  confidence_score?: number | null;
  created_at: string;
  updated_at: string;
}

export interface EntityEdge {
  id: string;
  organization_id: string;
  from_node_id: string;
  to_node_id: string;
  edge_type: EdgeType;
  evidence: Record<string, unknown>;
  created_at: string;
  // Joined
  from_node?: Pick<EntityNode, 'entity_type' | 'canonical_value' | 'display_value'>;
  to_node?: Pick<EntityNode, 'entity_type' | 'canonical_value' | 'display_value'>;
}

export interface SignalEntityLink {
  id: string;
  organization_id: string;
  signal_id: string;
  entity_node_id: string;
  relation_type: string;
  created_at: string;
  // Joined
  entity_node?: EntityNode;
}

export interface CorrelateEntitiesResult {
  success: boolean;
  organization_id: string;
  signals_processed: number;
  nodes_created: number;
  edges_created: number;
  links_created: number;
  errors: string[];
}

export interface EntityGraphSummary {
  total_nodes: number;
  total_edges: number;
  by_type: Record<EntityType, number>;
  top_connected: Array<{
    node: EntityNode;
    signal_count: number;
    edge_count: number;
  }>;
}

// ─── Entity Normalizers ───────────────────────────────────────────────────────

const DOMAIN_RE   = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;
const IP_RE       = /^(?:\d{1,3}\.){3}\d{1,3}$/;
const EMAIL_RE    = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE      = /^https?:\/\//i;
const REPO_RE     = /github\.com|gitlab\.com|bitbucket\.org/i;
const CERT_HASH_RE = /^[0-9a-f]{40,64}$/i;

export function normalizeEntityValue(type: EntityType, raw: string): string {
  const v = raw.trim();
  switch (type) {
    case 'domain':
    case 'subdomain':
      // Strip protocol/path, lowercase
      return v.replace(/^https?:\/\//i, '').replace(/\/.*$/, '').toLowerCase();
    case 'email':
      return v.toLowerCase();
    case 'ip':
      // Normalise each octet
      return v.split('.').map(o => String(parseInt(o, 10))).join('.');
    case 'certificate':
      return v.toLowerCase().replace(/[^0-9a-f]/g, '');
    case 'repository':
      return v.toLowerCase().replace(/\.git$/, '');
    default:
      return v.toLowerCase();
  }
}

export function detectEntityType(value: string): EntityType | null {
  const v = value.trim();
  if (!v) return null;

  // Strip URL wrapper to get the host
  let host = v;
  if (URL_RE.test(v)) {
    try {
      host = new URL(v).hostname;
    } catch {
      host = v.replace(/^https?:\/\//i, '').split('/')[0];
    }
  }

  if (IP_RE.test(host))                    return 'ip';
  if (EMAIL_RE.test(v))                    return 'email';
  if (REPO_RE.test(v))                     return 'repository';
  if (CERT_HASH_RE.test(v))                return 'certificate';
  if (DOMAIN_RE.test(host)) {
    return host.split('.').length > 2 ? 'subdomain' : 'domain';
  }
  return null;
}

export function buildEntityKey(entityType: EntityType, canonicalValue: string): string {
  return `${entityType}:${canonicalValue.trim().toLowerCase()}`;
}

// ─── Helper Normalizers ───────────────────────────────────────────────────────

const SEVERITY_MAP: Record<string, Severity> = {
  critical: 'critical',
  crit: 'critical',
  high: 'high',
  medium: 'medium',
  med: 'medium',
  moderate: 'medium',
  low: 'low',
  info: 'info',
  informational: 'info',
  none: 'info',
};

export function normalizeSeverity(input: string | null | undefined): Severity {
  if (!input) return 'info';
  return SEVERITY_MAP[input.trim().toLowerCase()] ?? 'info';
}

const SIGNAL_STATUS_MAP: Record<string, SignalStatus> = {
  new: 'new',
  open: 'open',
  acknowledged: 'acknowledged',
  correlated: 'correlated',
  ignored: 'ignored',
  resolved: 'resolved',
  closed: 'closed',
};

export function normalizeSignalStatus(input: string | null | undefined): SignalStatus {
  if (!input) return 'new';
  return SIGNAL_STATUS_MAP[input.trim().toLowerCase()] ?? 'new';
}

export function sanitizeSignalText(input: string | null | undefined, maxLen = 500): string {
  if (!input) return '';
  return input.trim().slice(0, maxLen).replace(/[\u0000-\u001F\u007F]/g, '');
}
