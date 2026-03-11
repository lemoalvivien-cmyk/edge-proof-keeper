/**
 * External API Client — SENTINEL EDGE
 * Abstraction layer for future external backend integration.
 * If VITE_CORE_API_URL / VITE_AI_GATEWAY_URL are not set, functions throw a clear error.
 */

const CORE_API_URL = import.meta.env.VITE_CORE_API_URL as string | undefined;
const AI_GATEWAY_URL = import.meta.env.VITE_AI_GATEWAY_URL as string | undefined;

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
  if (!AI_GATEWAY_URL) {
    throw new Error('Backend externe non configuré (VITE_AI_GATEWAY_URL manquant)');
  }
  return AI_GATEWAY_URL;
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
 * Create a new tool run on the external core backend.
 */
export async function createToolRun(
  payload: CreateToolRunPayload,
  token: string
): Promise<CreateToolRunResult> {
  const base = requireCoreApi();
  const res = await fetch(`${base}/tool-runs`, {
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

  const res = await fetch(`${base}/tool-runs/${payload.tool_run_id}/artifact`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }, // no Content-Type — let browser set multipart boundary
    body: formData,
  });
  return handleResponse<UploadArtifactResult>(res);
}

/**
 * Trigger executive report generation via the AI gateway.
 */
export async function generateExecutiveReport(
  payload: GenerateReportPayload,
  token: string
): Promise<GenerateReportResult> {
  const base = requireAiGateway();
  const res = await fetch(`${base}/reports/executive`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse<GenerateReportResult>(res);
}

/**
 * Trigger technical report generation via the AI gateway.
 */
export async function generateTechnicalReport(
  payload: GenerateReportPayload,
  token: string
): Promise<GenerateReportResult> {
  const base = requireAiGateway();
  const res = await fetch(`${base}/reports/technical`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
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
  const res = await fetch(`${base}/evidence/verify-chain`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify(payload),
  });
  return handleResponse<VerifyChainResult>(res);
}

// ─── Config check ─────────────────────────────────────────────────────────────

/**
 * Returns true if the external backend is configured.
 * Use this to conditionally show "Backend externe non configuré" in the UI.
 */
export function isExternalBackendConfigured(): boolean {
  return Boolean(CORE_API_URL && AI_GATEWAY_URL);
}

export const apiClient = {
  createToolRun,
  uploadToolRunArtifact,
  generateExecutiveReport,
  generateTechnicalReport,
  verifyEvidenceChain,
  isExternalBackendConfigured,
};
