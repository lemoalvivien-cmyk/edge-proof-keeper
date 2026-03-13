// Finding types for SECURIT-E

export type FindingStatus = 'open' | 'acknowledged' | 'remediated' | 'false_positive';
export type FindingConfidence = 'high' | 'medium' | 'low';
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Finding {
  id: string;
  organization_id: string;
  tool_run_id: string;
  asset_id: string | null;
  title: string;
  finding_type: string;
  severity: RiskLevel;
  confidence: FindingConfidence;
  evidence: Record<string, unknown>;
  references: string[];
  status: FindingStatus;
  first_seen: string;
  updated_at: string;
  // Joined
  tool_runs?: {
    id: string;
    mode: string;
    tools_catalog?: {
      name: string;
      slug: string;
    };
  };
  finding_control_links?: FindingControlLink[];
}

export interface FindingControlLink {
  id: string;
  finding_id: string;
  framework: 'gdpr' | 'nis2';
  control_id: string;
  reason: string;
  created_at: string;
  compliance_controls?: {
    control_id: string;
    title: string;
    framework: string;
  };
}

export interface FindingCounts {
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  total: number;
}
