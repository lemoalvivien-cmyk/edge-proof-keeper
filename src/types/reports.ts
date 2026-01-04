// Report types for SENTINEL EDGE

export type ReportStatus = 'generating' | 'ready' | 'failed';

export interface ExecutiveReport {
  summary: string;
  top_risks: Array<{
    risk: string;
    why_it_matters: string;
  }>;
  legal_risks: string;
  action_plan: {
    '7_days': string;
    '30_days': string;
    '90_days': string;
  };
  confidence: 'High' | 'Medium' | 'Low';
}

export interface TechnicalReport {
  context: string;
  scope: string;
  findings_table: Array<{
    title: string;
    severity: string;
    type: string;
    evidence: string;
  }>;
  recommendations: string[];
  traceability: {
    tool_run_id: string;
    artifact_hash: string;
    timestamp: string;
    sources: string[];
  };
}

export interface Report {
  id: string;
  organization_id: string;
  tool_run_id: string;
  status: ReportStatus;
  executive_md: string | null;
  technical_md: string | null;
  executive_json: ExecutiveReport | null;
  technical_json: TechnicalReport | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joined
  tool_runs?: {
    id: string;
    mode: string;
    status: string;
    tools_catalog?: {
      name: string;
      slug: string;
    };
  };
}
