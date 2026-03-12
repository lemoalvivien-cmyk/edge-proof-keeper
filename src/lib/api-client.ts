/**
 * SENTINEL EDGE — API Client
 *
 * Report generation strategy (controlled by reportsMode from useRuntimeConfig):
 *   external_only      → requires VITE_CORE_API_URL / runtime core_api_url
 *   internal_fallback  → tries external, falls back to Edge Function generate-reports
 *   internal_only      → always uses Edge Function generate-reports (default / safe mode)
 *
 * The frontend NEVER calls AI providers directly.
 * All AI logic lives in Edge Functions (server-side).
 */

// ─── Env-level config (build-time) ───────────────────────────────────────────
let _runtimeCoreApiUrl: string | null = null;
let _runtimeAiGatewayUrl: string | null = null;

/** Called once by useRuntimeConfig to inject DB-level overrides */
export function setRuntimeApiUrls(coreApi: string | null, aiGateway: string | null) {
  _runtimeCoreApiUrl  = coreApi  ? coreApi.replace(/\/$/, '')  : null;
  _runtimeAiGatewayUrl = aiGateway ? aiGateway.replace(/\/$/, '') : null;
}

function getCoreApiUrl(): string | null {
  return _runtimeCoreApiUrl
    ?? ((import.meta.env.VITE_CORE_API_URL as string | undefined)?.replace(/\/$/, '') || null);
}

function getAiGatewayUrl(): string | null {
  return _runtimeAiGatewayUrl
    ?? ((import.meta.env.VITE_AI_GATEWAY_URL as string | undefined)?.replace(/\/$/, '') || null)
    ?? getCoreApiUrl();
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateToolRunPayload {
  organization_id: string;
  tool_slug: string;
  mode: 'import_json' | 'import_pdf' | 'import_csv';
  asset_id?: string;
}

export interface CreateToolRunResult {
  tool_run_id: string;
}

export interface UploadArtifactPayload {
  tool_run_id: string;
  file: File;
  organization_id: string;
}

export interface UploadArtifactResult {
  artifact_url: string;
  artifact_hash: string;
}

export interface GenerateReportPayload {
  tool_run_id: string;
}

// ─── Executive Report (DG / PDG) ──────────────────────────────────────────────

export interface ExecutiveReportResult {
  summary: string;
  risk_level: 'critical' | 'high' | 'medium' | 'low' | 'info';
  business_impact: string;
  top_priorities: string[];
  recommendations: string[];
  generated_by?: 'external' | 'internal';
}

// ─── Technical Report (DSI) ───────────────────────────────────────────────────

export interface TechnicalFinding {
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  asset: string;
  evidence: string;
  remediation: string;
}

export interface TechnicalReportResult {
  summary: string;
  findings: TechnicalFinding[];
  generated_by?: 'external' | 'internal';
}

export interface VerifyChainPayload {
  organization_id: string;
}

export interface VerifyChainResult {
  is_valid: boolean;
  last_seq: number;
  head_hash: string;
  first_bad_seq: number | null;
  has_discrepancy: boolean;
}

export type ReportsMode = 'external_only' | 'internal_fallback' | 'internal_only';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

function authHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/** True if an external backend URL is available (runtime or env) */
export function isExternalBackendConfigured(): boolean {
  return Boolean(getCoreApiUrl());
}

// ─── External Backend Functions ───────────────────────────────────────────────

export async function createToolRun(
  payload: CreateToolRunPayload,
  token: string
): Promise<CreateToolRunResult> {
  const base = getCoreApiUrl();
  if (!base) throw new Error('Backend externe non configuré (VITE_CORE_API_URL manquant)');
  const res = await fetch(`${base}/v1/tool-runs`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse<CreateToolRunResult>(res);
}

export async function uploadToolRunArtifact(
  payload: UploadArtifactPayload,
  token: string
): Promise<UploadArtifactResult> {
  const base = getCoreApiUrl();
  if (!base) throw new Error('Backend externe non configuré (VITE_CORE_API_URL manquant)');
  const formData = new FormData();
  formData.append('file', payload.file);
  formData.append('tool_run_id', payload.tool_run_id);
  formData.append('organization_id', payload.organization_id);

  const res = await fetch(`${base}/v1/tool-runs/${payload.tool_run_id}/artifact`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
  return handleResponse<UploadArtifactResult>(res);
}

// ─── Internal fallback via Edge Function generate-reports ────────────────────

async function generateReportInternal(
  runId: string,
  reportType: 'executive' | 'technical',
  token: string
): Promise<ExecutiveReportResult | TechnicalReportResult> {
  const token2 = token || await getSupabaseToken();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-reports`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token2}`,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ tool_run_id: runId, report_type: reportType }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error ?? `generate-reports error ${res.status}`);
  return { ...json, generated_by: 'internal' };
}

// ─── Unified report generation (mode-aware) ──────────────────────────────────

export async function generateExecutiveReport(
  runId: string,
  token?: string,
  mode: ReportsMode = 'internal_fallback'
): Promise<ExecutiveReportResult> {
  const aiBase = getAiGatewayUrl();
  const tok = token ?? await getSupabaseToken();

  // external_only — require external backend
  if (mode === 'external_only') {
    if (!aiBase) throw new Error('Backend externe non configuré (VITE_CORE_API_URL manquant)');
    const headers: HeadersInit = tok ? authHeaders(tok) : { 'Content-Type': 'application/json' };
    const res = await fetch(`${aiBase}/v1/reports/executive`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tool_run_id: runId } satisfies GenerateReportPayload),
    });
    return { ...(await handleResponse<ExecutiveReportResult>(res)), generated_by: 'external' };
  }

  // internal_only — always use Edge Function
  if (mode === 'internal_only') {
    return generateReportInternal(runId, 'executive', tok) as Promise<ExecutiveReportResult>;
  }

  // internal_fallback (default) — try external, fall back to internal
  if (aiBase) {
    try {
      const headers: HeadersInit = tok ? authHeaders(tok) : { 'Content-Type': 'application/json' };
      const res = await fetch(`${aiBase}/v1/reports/executive`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ tool_run_id: runId } satisfies GenerateReportPayload),
      });
      if (res.ok) return { ...(await res.json()), generated_by: 'external' };
    } catch {
      // fall through to internal
    }
  }
  return generateReportInternal(runId, 'executive', tok) as Promise<ExecutiveReportResult>;
}

export async function generateTechnicalReport(
  runId: string,
  token?: string,
  mode: ReportsMode = 'internal_fallback'
): Promise<TechnicalReportResult> {
  const aiBase = getAiGatewayUrl();
  const tok = token ?? await getSupabaseToken();

  if (mode === 'external_only') {
    if (!aiBase) throw new Error('Backend externe non configuré (VITE_CORE_API_URL manquant)');
    const headers: HeadersInit = tok ? authHeaders(tok) : { 'Content-Type': 'application/json' };
    const res = await fetch(`${aiBase}/v1/reports/technical`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ tool_run_id: runId } satisfies GenerateReportPayload),
    });
    return { ...(await handleResponse<TechnicalReportResult>(res)), generated_by: 'external' };
  }

  if (mode === 'internal_only') {
    return generateReportInternal(runId, 'technical', tok) as Promise<TechnicalReportResult>;
  }

  // internal_fallback
  if (aiBase) {
    try {
      const headers: HeadersInit = tok ? authHeaders(tok) : { 'Content-Type': 'application/json' };
      const res = await fetch(`${aiBase}/v1/reports/technical`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ tool_run_id: runId } satisfies GenerateReportPayload),
      });
      if (res.ok) return { ...(await res.json()), generated_by: 'external' };
    } catch {
      // fall through to internal
    }
  }
  return generateReportInternal(runId, 'technical', tok) as Promise<TechnicalReportResult>;
}

export async function verifyEvidenceChain(
  payload: VerifyChainPayload,
  token: string
): Promise<VerifyChainResult> {
  const base = getCoreApiUrl();
  if (!base) throw new Error('Backend externe non configuré (VITE_CORE_API_URL manquant)');
  const res = await fetch(`${base}/v1/evidence/verify-chain`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse<VerifyChainResult>(res);
}

export async function getHealth(): Promise<unknown> {
  const base = getCoreApiUrl();
  if (!base) throw new Error('Backend externe non configuré');
  const response = await fetch(`${base}/health`);
  if (!response.ok) throw new Error('API Cyber Serenity indisponible');
  return response.json();
}

// ─── Core Engine API (Supabase Edge Functions) ────────────────────────────────

import { supabase } from '@/integrations/supabase/client';
import { normalizeSignalRecord, normalizeSignalRows } from '@/lib/engine-normalizers';
import type {
  PlatformHealthStatus,
  Signal,
  Risk,
  RemediationAction,
  AiAnalysis,
  RiskIntelligenceResult,
  AnalyzeRiskIntelligenceResult,
  EnhanceRemediationResult,
  DataSource,
  SourceSyncRun,
  SignalInput,
  IngestSignalsResult,
  CorrelateRisksResult,
  BuildRemediationQueueResult,
  AnalyzeSignalResult,
  GenerateRemediationPlanResult,
  IngestSourcePayloadInput,
  IngestSourcePayloadResult,
  SyncPublicIntelResult,
  SyncCustomerAuthorizedResult,
  EntityNode,
  EntityEdge,
  SignalEntityLink,
  CorrelateEntitiesResult,
  EntityGraphSummary,
  Alert,
  NotificationRule,
  PlatformHealthSnapshot,
  ScheduleSourceSyncResult,
  StaleRiskCheckResult,
  EvaluateAlertRulesResult,
  PortfolioSummaryType,
  PortfolioSummary,
  GeneratePortfolioSummaryResult,
} from '@/types/engine';

async function getSupabaseToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');
  return session.access_token;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

async function callEdgeFunction<T>(
  functionName: string,
  body: Record<string, unknown>
): Promise<T> {
  const token = await getSupabaseToken();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok && res.status !== 207) {
    throw new Error(json?.error ?? `${functionName} error ${res.status}`);
  }
  return json as T;
}

export async function getPlatformHealth(orgId?: string): Promise<PlatformHealthStatus> {
  const url = orgId
    ? `${SUPABASE_URL}/functions/v1/platform-health?org_id=${orgId}`
    : `${SUPABASE_URL}/functions/v1/platform-health`;

  const headers: HeadersInit = { 'apikey': SUPABASE_ANON_KEY };

  if (orgId) {
    try {
      const token = await getSupabaseToken();
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    } catch {
      // proceed without auth
    }
  }

  const res = await fetch(url, { headers });
  if (!res.ok && res.status !== 503) {
    throw new Error(`platform-health error ${res.status}`);
  }
  return res.json() as Promise<PlatformHealthStatus>;
}

export async function getSignals(
  orgId: string,
  options?: { status?: string; limit?: number }
): Promise<Signal[]> {
  let query = supabase
    .from('signals')
    .select(`
      *,
      data_sources:source_id(name, source_type, category),
      assets:asset_id(name, asset_type, identifier)
    `)
    .eq('organization_id', orgId)
    .order('detected_at', { ascending: false })
    .limit(options?.limit ?? 100);

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  const { data, error } = await query;
  if (error) throw new Error(`getSignals error: ${error.message}`);
  return normalizeSignalRows((data ?? []) as Record<string, unknown>[]);
}

export async function getRisks(
  orgId: string,
  options?: { status?: string; limit?: number }
): Promise<Risk[]> {
  let query = supabase
    .from('risk_register')
    .select('*, asset_id!fk_risk_register_asset_id(name, asset_type, identifier)')
    .eq('organization_id', orgId)
    .order('score', { ascending: false })
    .limit(options?.limit ?? 100);

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  const { data, error } = await query;
  if (error) throw new Error(`getRisks error: ${error.message}`);
  return (data ?? []) as unknown as Risk[];
}

// ─── Sources API ──────────────────────────────────────────────────────────────

export async function getSources(orgId: string): Promise<DataSource[]> {
  const { data, error } = await supabase
    .from('data_sources')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`getSources error: ${error.message}`);
  return (data ?? []) as unknown as DataSource[];
}

export async function getSourceSyncRuns(
  orgId: string,
  sourceId: string,
  limit = 20
): Promise<SourceSyncRun[]> {
  const { data, error } = await supabase
    .from('source_sync_runs')
    .select('*')
    .eq('organization_id', orgId)
    .eq('source_id', sourceId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`getSourceSyncRuns error: ${error.message}`);
  return (data ?? []) as unknown as SourceSyncRun[];
}

export async function getSourceSignalCount(orgId: string, sourceId: string): Promise<number> {
  const { count, error } = await supabase
    .from('signals')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('source_id', sourceId);

  if (error) throw new Error(`getSourceSignalCount error: ${error.message}`);
  return count ?? 0;
}

export async function ingestSourcePayload(
  payload: IngestSourcePayloadInput
): Promise<IngestSourcePayloadResult> {
  return callEdgeFunction<IngestSourcePayloadResult>('ingest-source-payload', payload as unknown as Record<string, unknown>);
}

export async function syncPublicIntelSource(sourceId: string): Promise<SyncPublicIntelResult> {
  return callEdgeFunction<SyncPublicIntelResult>('sync-public-intel-source', { source_id: sourceId });
}

export async function syncCustomerAuthorizedSource(
  sourceId: string,
  items: unknown[],
  providerName?: string,
  importContext?: Record<string, unknown>
): Promise<SyncCustomerAuthorizedResult> {
  return callEdgeFunction<SyncCustomerAuthorizedResult>('sync-customer-authorized-source', {
    source_id: sourceId,
    items,
    provider_name: providerName,
    import_context: importContext,
  });
}

// ─── Legacy ingestion (kept for compatibility) ────────────────────────────────

export async function ingestSignals(
  orgId: string,
  sourceId: string,
  signals: SignalInput[]
): Promise<IngestSignalsResult> {
  const token = await getSupabaseToken();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/ingest-signals`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ organization_id: orgId, source_id: sourceId, signals }),
  });
  const json = await res.json();
  if (!res.ok && res.status !== 207) {
    throw new Error(json.error ?? `ingest-signals error ${res.status}`);
  }
  return json as IngestSignalsResult;
}

export async function correlateRisks(orgId: string): Promise<CorrelateRisksResult> {
  return callEdgeFunction<CorrelateRisksResult>('correlate-risks', { organization_id: orgId });
}

export async function getRiskById(riskId: string): Promise<Risk | null> {
  const { data, error } = await supabase
    .from('risk_register')
    .select('*, assets:asset_id(name, asset_type, identifier)')
    .eq('id', riskId)
    .maybeSingle();
  if (error) throw new Error(`getRiskById error: ${error.message}`);
  return data as unknown as Risk | null;
}

export async function getRemediationActions(
  orgId: string,
  options?: { status?: string; priority?: string; risk_id?: string; limit?: number }
): Promise<RemediationAction[]> {
  let q = supabase
    .from('remediation_actions')
    .select('*, risk_register:risk_id(id, title, risk_level, score)')
    .eq('organization_id', orgId)
    .order('priority', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false })
    .limit(options?.limit ?? 200);

  if (options?.status)   q = q.eq('status', options.status);
  if (options?.priority) q = q.eq('priority', options.priority);
  if (options?.risk_id)  q = q.eq('risk_id', options.risk_id);

  const { data, error } = await q;
  if (error) throw new Error(`getRemediationActions error: ${error.message}`);
  return (data ?? []) as unknown as RemediationAction[];
}

export async function buildRemediationQueue(orgId: string): Promise<BuildRemediationQueueResult> {
  return callEdgeFunction<BuildRemediationQueueResult>('build-remediation-queue', { organization_id: orgId });
}

export async function analyzeSignalWithAI(
  orgId: string,
  signalId: string
): Promise<AnalyzeSignalResult> {
  return callEdgeFunction<AnalyzeSignalResult>('analyze-signal-with-gemini', {
    organization_id: orgId,
    signal_id: signalId,
  });
}

export async function generateRemediationPlan(
  orgId: string,
  riskId: string
): Promise<GenerateRemediationPlanResult> {
  return callEdgeFunction<GenerateRemediationPlanResult>('generate-remediation-plan', {
    organization_id: orgId,
    risk_id: riskId,
  });
}

// ─── AI Intelligence Layer ────────────────────────────────────────────────────

export async function analyzeRiskIntelligence(
  orgId: string,
  riskId: string
): Promise<AnalyzeRiskIntelligenceResult> {
  return callEdgeFunction<AnalyzeRiskIntelligenceResult>('analyze-risk-intelligence', {
    organization_id: orgId,
    risk_id: riskId,
  });
}

export async function enhanceRemediationActions(
  orgId: string,
  riskId: string
): Promise<EnhanceRemediationResult> {
  return callEdgeFunction<EnhanceRemediationResult>('enhance-remediation-actions', {
    organization_id: orgId,
    risk_id: riskId,
  });
}

export async function getRiskAiAnalysis(
  orgId: string,
  riskId: string,
  analysisType: 'technical_analysis' | 'remediation_plan' = 'technical_analysis'
): Promise<AiAnalysis | null> {
  const { data, error } = await supabase
    .from('ai_analyses')
    .select('*')
    .eq('organization_id', orgId)
    .eq('entity_id', riskId)
    .eq('entity_type', 'risk')
    .eq('analysis_type', analysisType)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`getRiskAiAnalysis error: ${error.message}`);
  return data as unknown as AiAnalysis | null;
}

export async function getAiAnalysisCount(orgId: string): Promise<number> {
  const { count, error } = await supabase
    .from('ai_analyses')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId);
  if (error) return 0;
  return count ?? 0;
}

// ─── Monitoring & Alerting API ────────────────────────────────────────────────

export async function getAlerts(
  orgId: string,
  options?: { status?: string; severity?: string; limit?: number }
): Promise<Alert[]> {
  let q = supabase
    .from('alerts')
    .select('*')
    .eq('organization_id', orgId)
    .order('last_detected_at', { ascending: false })
    .limit(options?.limit ?? 100);

  if (options?.status)   q = q.eq('status', options.status);
  if (options?.severity) q = q.eq('severity', options.severity);

  const { data, error } = await q;
  if (error) throw new Error(`getAlerts error: ${error.message}`);
  return (data ?? []) as unknown as Alert[];
}

export async function updateAlertStatus(
  alertId: string,
  status: 'open' | 'acknowledged' | 'resolved'
): Promise<void> {
  const { error } = await supabase
    .from('alerts')
    .update({ status })
    .eq('id', alertId);
  if (error) throw new Error(`updateAlertStatus error: ${error.message}`);
}

export async function getNotificationRules(orgId: string): Promise<NotificationRule[]> {
  const { data, error } = await supabase
    .from('notification_rules')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(`getNotificationRules error: ${error.message}`);
  return (data ?? []) as unknown as NotificationRule[];
}

export async function getHealthSnapshots(orgId: string, limit = 10): Promise<PlatformHealthSnapshot[]> {
  const { data, error } = await supabase
    .from('platform_health_snapshots')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new Error(`getHealthSnapshots error: ${error.message}`);
  return (data ?? []) as unknown as PlatformHealthSnapshot[];
}

export async function runScheduledSourceSync(orgId: string): Promise<ScheduleSourceSyncResult> {
  return callEdgeFunction<ScheduleSourceSyncResult>('schedule-source-sync', { organization_id: orgId });
}

export async function runStaleRiskCheck(orgId: string): Promise<StaleRiskCheckResult> {
  return callEdgeFunction<StaleRiskCheckResult>('stale-risk-check', { organization_id: orgId });
}

export async function evaluateAlertRules(orgId: string): Promise<EvaluateAlertRulesResult> {
  return callEdgeFunction<EvaluateAlertRulesResult>('evaluate-alert-rules', { organization_id: orgId });
}

// ─── Entity Graph API ─────────────────────────────────────────────────────────

export async function getSignalById(signalId: string): Promise<Signal | null> {
  const { data, error } = await supabase
    .from('signals')
    .select(`
      *,
      data_sources:source_id(name, source_type, category),
      assets:asset_id(name, asset_type, identifier)
    `)
    .eq('id', signalId)
    .maybeSingle();

  if (error) throw new Error(`getSignalById error: ${error.message}`);
  if (!data) return null;
  return normalizeSignalRecord(data as Record<string, unknown>);
}

export async function getSignalEntities(
  signalId: string,
  orgId: string,
): Promise<SignalEntityLink[]> {
  const { data, error } = await supabase
    .from('signal_entity_links')
    .select('*, entity_node_id(id, entity_type, canonical_value, display_value, metadata, confidence_score, created_at, updated_at)')
    .eq('signal_id', signalId)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`getSignalEntities error: ${error.message}`);
  return (data ?? []).map(row => ({
    ...row,
    entity_node: row.entity_node_id as unknown as EntityNode,
  })) as unknown as SignalEntityLink[];
}

export async function getEntityGraphSummary(orgId: string): Promise<EntityGraphSummary> {
  const [nodesRes, edgesRes] = await Promise.all([
    supabase
      .from('entity_nodes')
      .select('id, entity_type')
      .eq('organization_id', orgId),
    supabase
      .from('entity_edges')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),
  ]);

  if (nodesRes.error) throw new Error(`getEntityGraphSummary nodes error: ${nodesRes.error.message}`);
  if (edgesRes.error) throw new Error(`getEntityGraphSummary edges error: ${edgesRes.error.message}`);

  const nodes = nodesRes.data ?? [];
  const by_type = {} as Record<string, number>;
  for (const n of nodes) {
    by_type[n.entity_type] = (by_type[n.entity_type] ?? 0) + 1;
  }

  return {
    total_nodes: nodes.length,
    total_edges: edgesRes.count ?? 0,
    by_type: by_type as EntityGraphSummary['by_type'],
    top_connected: [],
  };
}

export async function getEntityNodes(
  orgId: string,
  options?: { entity_type?: string; limit?: number },
): Promise<EntityNode[]> {
  let q = supabase
    .from('entity_nodes')
    .select('*')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(options?.limit ?? 200);

  if (options?.entity_type) {
    q = q.eq('entity_type', options.entity_type);
  }

  const { data, error } = await q;
  if (error) throw new Error(`getEntityNodes error: ${error.message}`);
  return (data ?? []) as unknown as EntityNode[];
}

export async function getRelatedSignals(
  orgId: string,
  entityNodeId: string,
): Promise<Signal[]> {
  const { data: links, error: linkErr } = await supabase
    .from('signal_entity_links')
    .select('signal_id')
    .eq('organization_id', orgId)
    .eq('entity_node_id', entityNodeId)
    .limit(50);

  if (linkErr) throw new Error(`getRelatedSignals links error: ${linkErr.message}`);
  const ids = (links ?? []).map(l => l.signal_id);
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from('signals')
    .select('*, data_sources:source_id(name, source_type, category)')
    .in('id', ids)
    .eq('organization_id', orgId)
    .order('detected_at', { ascending: false });

  if (error) throw new Error(`getRelatedSignals signals error: ${error.message}`);
  return normalizeSignalRows((data ?? []) as Record<string, unknown>[]);
}

export async function runEntityCorrelation(
  orgId: string,
  signalIds?: string[],
): Promise<CorrelateEntitiesResult> {
  return callEdgeFunction<CorrelateEntitiesResult>('correlate-entities', {
    organization_id: orgId,
    ...(signalIds?.length ? { signal_ids: signalIds } : {}),
  });
}

export const apiClient = {
  // External backend
  createToolRun,
  uploadToolRunArtifact,
  generateExecutiveReport,
  generateTechnicalReport,
  verifyEvidenceChain,
  isExternalBackendConfigured,
  getHealth,
  // Platform
  getPlatformHealth,
  // Signals & Risks
  getSignals,
  getSignalById,
  getRisks,
  ingestSignals,
  correlateRisks,
  analyzeSignalWithAI,
  generateRemediationPlan,
  // Sources
  getSources,
  getSourceSyncRuns,
  getSourceSignalCount,
  ingestSourcePayload,
  syncPublicIntelSource,
  syncCustomerAuthorizedSource,
  // Entity Graph
  getSignalEntities,
  getEntityGraphSummary,
  getEntityNodes,
  getRelatedSignals,
  runEntityCorrelation,
  // Risks & Remediation
  getRiskById,
  getRemediationActions,
  buildRemediationQueue,
  // AI Intelligence Layer
  analyzeRiskIntelligence,
  enhanceRemediationActions,
  getRiskAiAnalysis,
  getAiAnalysisCount,
};
