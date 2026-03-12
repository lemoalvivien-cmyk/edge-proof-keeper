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
  // AI gateway falls back to core API if only one URL is configured
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

// ─── API Functions ────────────────────────────────────────────────────────────

/**
 * Create a new tool run via the external core backend.
 */
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

/**
 * Upload a scan artifact file for a given tool run.
 */
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
    headers: { Authorization: `Bearer ${token}` }, // no Content-Type — browser sets multipart boundary
    body: formData,
  });
  return handleResponse<UploadArtifactResult>(res);
}

/**
 * Trigger executive (DG/PDG) report generation.
 * Calls POST VITE_CORE_API_URL/v1/reports/executive
 * Payload: { tool_run_id }
 *
 * NOTE: The frontend NEVER calls an AI provider directly.
 * Your backend proxy at VITE_CORE_API_URL is responsible for:
 *  - validating the request
 *  - building the fact_pack
 *  - calling the AI (Qwen, GPT, etc.)
 *  - storing the result
 */
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

/**
 * Trigger technical (DSI) report generation.
 * Calls POST VITE_CORE_API_URL/v1/reports/technical
 * Payload: { tool_run_id }
 */
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

/**
 * Verify the integrity of the evidence chain for an organization.
 */
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

// ─── Config helpers ───────────────────────────────────────────────────────────

/**
 * Returns true if the external backend is configured.
 * Use this to conditionally show "Backend externe non configuré" in the UI.
 */
export function isExternalBackendConfigured(): boolean {
  return Boolean(CORE_API_URL);
}

/**
 * Health check for the external backend.
 * Calls GET VITE_CORE_API_URL/health
 */
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
  SignalInput,
  IngestSignalsResult,
  CorrelateRisksResult,
  AnalyzeSignalResult,
  GenerateRemediationPlanResult,
} from '@/types/engine';

async function getSupabaseToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');
  return session.access_token;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

/**
 * Get platform health status. Does not require authentication.
 * Pass orgId to also get per-org counts (requires being logged in).
 */
export async function getPlatformHealth(orgId?: string): Promise<PlatformHealthStatus> {
  const url = orgId
    ? `${SUPABASE_URL}/functions/v1/platform-health?org_id=${orgId}`
    : `${SUPABASE_URL}/functions/v1/platform-health`;

  const headers: HeadersInit = {
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
  };

  if (orgId) {
    try {
      const token = await getSupabaseToken();
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    } catch {
      // proceed without auth — org_counts will be omitted
    }
  }

  const res = await fetch(url, { headers });
  if (!res.ok && res.status !== 503) {
    throw new Error(`platform-health error ${res.status}`);
  }
  return res.json() as Promise<PlatformHealthStatus>;
}

/**
 * Get signals for an organization, ordered by severity then detected_at.
 */
export async function getSignals(
  orgId: string,
  options?: { status?: string; limit?: number }
): Promise<Signal[]> {
  let query = supabase
    .from('signals')
    .select('*, source_id!fk_signals_source_id(name, source_type, category), asset_id!fk_signals_asset_id(name, asset_type, identifier)')
    .eq('organization_id', orgId)
    .order('detected_at', { ascending: false })
    .limit(options?.limit ?? 100);

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  const { data, error } = await query;
  if (error) throw new Error(`getSignals error: ${error.message}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []) as unknown as Signal[];
}

/**
 * Get risks from the risk register for an organization.
 */
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []) as unknown as Risk[];
}

/**
 * Ingest a batch of signals via the edge function.
 */
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
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
    },
    body: JSON.stringify({ organization_id: orgId, source_id: sourceId, signals }),
  });
  const json = await res.json();
  if (!res.ok && res.status !== 207) {
    throw new Error(json.error ?? `ingest-signals error ${res.status}`);
  }
  return json as IngestSignalsResult;
}

/**
 * Trigger risk correlation from open signals.
 */
export async function correlateRisks(orgId: string): Promise<CorrelateRisksResult> {
  const token = await getSupabaseToken();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/correlate-risks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
    },
    body: JSON.stringify({ organization_id: orgId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `correlate-risks error ${res.status}`);
  return json as CorrelateRisksResult;
}

/**
 * Analyze a signal with AI (server-side Gemini). Returns structured analysis.
 * Requires AI to be configured (LOVABLE_API_KEY is pre-configured).
 */
export async function analyzeSignalWithAI(
  orgId: string,
  signalId: string
): Promise<AnalyzeSignalResult> {
  const token = await getSupabaseToken();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/analyze-signal-with-gemini`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
    },
    body: JSON.stringify({ organization_id: orgId, signal_id: signalId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `analyze-signal error ${res.status}`);
  return json as AnalyzeSignalResult;
}

/**
 * Generate an AI-powered remediation plan for a risk.
 * Inserts actions into remediation_actions and stores analysis in ai_analyses.
 */
export async function generateRemediationPlan(
  orgId: string,
  riskId: string
): Promise<GenerateRemediationPlanResult> {
  const token = await getSupabaseToken();
  const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-remediation-plan`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
    },
    body: JSON.stringify({ organization_id: orgId, risk_id: riskId }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `generate-remediation-plan error ${res.status}`);
  return json as GenerateRemediationPlanResult;
}

export const apiClient = {
  // External backend (VITE_CORE_API_URL)
  createToolRun,
  uploadToolRunArtifact,
  generateExecutiveReport,
  generateTechnicalReport,
  verifyEvidenceChain,
  isExternalBackendConfigured,
  getHealth,
  // Core Engine (Supabase Edge Functions)
  getPlatformHealth,
  getSignals,
  getRisks,
  ingestSignals,
  correlateRisks,
  analyzeSignalWithAI,
  generateRemediationPlan,
};
