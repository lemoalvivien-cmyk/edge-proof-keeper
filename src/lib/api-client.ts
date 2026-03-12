/**
 * SENTINEL EDGE — External API Client
 *
 * All AI/report generation MUST go through VITE_CORE_API_URL (your backend proxy).
 * The frontend NEVER calls AI providers directly.
 *
 * When VITE_CORE_API_URL is not configured, functions throw a clear error so
 * the UI can surface "Backend externe non configuré".
 */

const CORE_API_URL = (import.meta.env.VITE_CORE_API_URL as string | undefined)?.replace(/\/$/, '');
const AI_GATEWAY_URL = (import.meta.env.VITE_AI_GATEWAY_URL as string | undefined)?.replace(/\/$/, '');

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function requireCoreApi(): string {
  if (!CORE_API_URL) {
    throw new Error('Backend externe non configuré (VITE_CORE_API_URL manquant)');
  }
  return CORE_API_URL;
}

function requireAiGateway(): string {
  const base = AI_GATEWAY_URL ?? CORE_API_URL;
  if (!base) {
    throw new Error('Backend externe non configuré (VITE_AI_GATEWAY_URL manquant)');
  }
  return base;
}

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

// ─── External Backend Functions ───────────────────────────────────────────────

export async function createToolRun(
  payload: CreateToolRunPayload,
  token: string
): Promise<CreateToolRunResult> {
  const base = requireCoreApi();
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
  const base = requireCoreApi();
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

export async function generateExecutiveReport(
  runId: string,
  token?: string
): Promise<ExecutiveReportResult> {
  const base = requireAiGateway();
  const headers: HeadersInit = token ? authHeaders(token) : { 'Content-Type': 'application/json' };
  const res = await fetch(`${base}/v1/reports/executive`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ tool_run_id: runId } satisfies GenerateReportPayload),
  });
  return handleResponse<ExecutiveReportResult>(res);
}

export async function generateTechnicalReport(
  runId: string,
  token?: string
): Promise<TechnicalReportResult> {
  const base = requireAiGateway();
  const headers: HeadersInit = token ? authHeaders(token) : { 'Content-Type': 'application/json' };
  const res = await fetch(`${base}/v1/reports/technical`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ tool_run_id: runId } satisfies GenerateReportPayload),
  });
  return handleResponse<TechnicalReportResult>(res);
}

export async function verifyEvidenceChain(
  payload: VerifyChainPayload,
  token: string
): Promise<VerifyChainResult> {
  const base = requireCoreApi();
  const res = await fetch(`${base}/v1/evidence/verify-chain`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse<VerifyChainResult>(res);
}

export function isExternalBackendConfigured(): boolean {
  return Boolean(CORE_API_URL);
}

export async function getHealth(): Promise<unknown> {
  const base = import.meta.env.VITE_CORE_API_URL as string | undefined;
  if (!base) {
    throw new Error('Backend externe non configuré');
  }
  const response = await fetch(`${base}/health`);
  if (!response.ok) {
    throw new Error('API Cyber Serenity indisponible');
  }
  return response.json();
}

// ─── Core Engine API (Supabase Edge Functions) ────────────────────────────────

import { supabase } from '@/integrations/supabase/client';
import type {
  PlatformHealthStatus,
  Signal,
  Risk,
  DataSource,
  SourceSyncRun,
  SignalInput,
  IngestSignalsResult,
  CorrelateRisksResult,
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
  // Map signal_refs → references for type compatibility
  return (data ?? []).map(row => ({
    ...row,
    references: (row as Record<string, unknown>).signal_refs ?? [],
  })) as unknown as Signal[];
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
  return {
    ...data,
    references: (data as Record<string, unknown>).signal_refs ?? [],
  } as unknown as Signal;
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
  // Get signal IDs linked to this entity
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
  return (data ?? []).map(row => ({
    ...row,
    references: (row as Record<string, unknown>).signal_refs ?? [],
  })) as unknown as Signal[];
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
};
