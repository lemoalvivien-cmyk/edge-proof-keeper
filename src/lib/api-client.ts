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

export interface GenerateReportResult {
  report_id: string;
  status: 'generating' | 'ready' | 'failed';
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
  token: string
): Promise<GenerateReportResult> {
  const base = requireAiGateway();
  const res = await fetch(`${base}/v1/reports/executive`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ tool_run_id: runId } satisfies GenerateReportPayload),
  });
  return handleResponse<GenerateReportResult>(res);
}

/**
 * Trigger technical (DSI) report generation.
 * Calls POST VITE_CORE_API_URL/v1/reports/technical
 * Payload: { tool_run_id }
 */
export async function generateTechnicalReport(
  runId: string,
  token: string
): Promise<GenerateReportResult> {
  const base = requireAiGateway();
  const res = await fetch(`${base}/v1/reports/technical`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ tool_run_id: runId } satisfies GenerateReportPayload),
  });
  return handleResponse<GenerateReportResult>(res);
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

export const apiClient = {
  createToolRun,
  uploadToolRunArtifact,
  generateExecutiveReport,
  generateTechnicalReport,
  verifyEvidenceChain,
  isExternalBackendConfigured,
};
