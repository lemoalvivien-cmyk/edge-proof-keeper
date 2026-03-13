// SECURIT-E - Type definitions for database entities

export type AppRole = 'admin' | 'auditor' | 'user';
export type AuthorizationStatus = 'pending' | 'approved' | 'expired' | 'revoked';
export type ScanType = 'vulnerability' | 'asset_discovery' | 'document_import' | 'compliance_check';
export type ComplianceFramework = 'gdpr' | 'nis2';
export type ControlStatus = 'not_started' | 'in_progress' | 'implemented' | 'not_applicable';
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  organization_id: string | null;
  email: string;
  full_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  organization_id: string;
  role: AppRole;
  created_at: string;
}

export interface Authorization {
  id: string;
  organization_id: string;
  created_by: string;
  document_url: string;
  document_hash: string;
  consent_checkbox: boolean;
  consent_ip_raw_deprecated: string;
  consent_ip_hash: string | null;
  consent_timestamp: string;
  consent_text_version: string | null;
  consent_text_hash: string | null;
  scope: string;
  scope_type: string;
  scope_domains: string[];
  scope_cidrs: string[];
  scope_assets: string[];
  target_rules: Record<string, unknown>;
  approved_by: string | null;
  approved_at: string | null;
  revoked_by: string | null;
  revoked_at: string | null;
  revoked_reason: string | null;
  valid_from: string;
  valid_until: string | null;
  status: AuthorizationStatus;
  created_at: string;
}

export interface Asset {
  id: string;
  organization_id: string;
  authorization_id: string | null;
  name: string;
  asset_type: string;
  identifier: string | null;
  description: string | null;
  risk_level: RiskLevel;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Scan {
  id: string;
  organization_id: string;
  authorization_id: string;
  asset_id: string | null;
  scan_type: ScanType;
  status: string;
  findings_count: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  raw_data: Record<string, unknown> | null;
  started_at: string | null;
  completed_at: string | null;
  created_by: string;
  created_at: string;
}

export interface Document {
  id: string;
  organization_id: string;
  authorization_id: string | null;
  title: string;
  document_type: string;
  file_url: string;
  file_hash: string;
  framework: ComplianceFramework | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface EvidenceLog {
  id: string;
  organization_id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  artifact_hash: string | null;
  created_at: string;
  // Hash chain fields
  source: string;
  seq: number | null;
  prev_hash: string | null;
  entry_hash: string | null;
}

export interface ComplianceControl {
  id: string;
  framework: ComplianceFramework;
  control_id: string;
  title: string;
  description: string | null;
  category: string | null;
  created_at: string;
}

export interface ControlMapping {
  id: string;
  organization_id: string;
  control_id: string;
  status: ControlStatus;
  evidence_notes: string | null;
  assigned_to: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface SecretsVault {
  id: string;
  organization_id: string;
  key_name: string;
  key_type: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}
