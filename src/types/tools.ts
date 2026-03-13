// Tool Registry types for SECURIT-E

export type ToolCategory = 'osint' | 'network' | 'web' | 'vuln' | 'secrets' | 'sast' | 'sca' | 'iac';

export type ToolRunMode = 'import_json' | 'import_pdf' | 'import_csv' | 'external_runner_disabled' | 'api_connector_disabled';

export type ToolRunStatus = 'requested' | 'awaiting_upload' | 'processing' | 'done' | 'failed';

export interface Tool {
  id: string;
  slug: string;
  name: string;
  category: string;
  official_site_url: string;
  repo_url: string;
  docs_url: string;
  docker_url: string | null;
  status: 'active' | 'archived';
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ToolPreset {
  id: string;
  tool_id: string;
  name: string;
  mode: ToolRunMode;
  requires_authorization: boolean;
  default_params: Record<string, unknown>;
  created_at: string;
}

export interface NormalizedFinding {
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  type: string;
  description: string;
  evidence: string;
  references: string[];
  raw: unknown;
}

export interface NormalizedOutput {
  tool: {
    slug: string;
    name: string;
    category: string;
  };
  target: {
    asset_id?: string;
    domain?: string;
    scope_text?: string;
  };
  timestamps: {
    requested_at: string;
    completed_at: string;
  };
  findings: NormalizedFinding[];
  counts: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  notes: string;
}

export interface ToolRun {
  id: string;
  organization_id: string;
  asset_id: string | null;
  authorization_id: string;
  tool_id: string;
  preset_id: string | null;
  mode: ToolRunMode;
  status: ToolRunStatus;
  requested_by: string;
  requested_at: string;
  completed_at: string | null;
  input_artifact_url: string | null;
  input_artifact_hash: string | null;
  normalized_output: NormalizedOutput | null;
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  } | null;
  created_at: string;
  // Joined data
  tools_catalog?: Tool;
}

export const CATEGORY_LABELS: Record<string, string> = {
  osint: 'OSINT',
  network: 'Réseau',
  web: 'Web',
  vuln: 'Vulnérabilités',
  secrets: 'Secrets',
  sast: 'SAST',
  sca: 'SCA',
  iac: 'IaC',
};

export const CATEGORY_COLORS: Record<string, string> = {
  osint: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  network: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  web: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  vuln: 'bg-red-500/10 text-red-500 border-red-500/20',
  secrets: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  sast: 'bg-green-500/10 text-green-500 border-green-500/20',
  sca: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  iac: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
};
