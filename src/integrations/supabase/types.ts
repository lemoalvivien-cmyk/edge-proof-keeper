export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ai_analyses: {
        Row: {
          analysis_type: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          input_fact_pack: Json
          model_name: string
          organization_id: string
          output_json: Json
          prompt_version: string
        }
        Insert: {
          analysis_type: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          input_fact_pack?: Json
          model_name: string
          organization_id: string
          output_json?: Json
          prompt_version: string
        }
        Update: {
          analysis_type?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          input_fact_pack?: Json
          model_name?: string
          organization_id?: string
          output_json?: Json
          prompt_version?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_analyses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_type: string
          authorization_id: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          identifier: string | null
          name: string
          organization_id: string
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          target_identifier: string | null
          updated_at: string
        }
        Insert: {
          asset_type: string
          authorization_id?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          identifier?: string | null
          name: string
          organization_id: string
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          target_identifier?: string | null
          updated_at?: string
        }
        Update: {
          asset_type?: string
          authorization_id?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          identifier?: string | null
          name?: string
          organization_id?: string
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          target_identifier?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_authorization_id_fkey"
            columns: ["authorization_id"]
            isOneToOne: false
            referencedRelation: "authorizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      authorizations: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          consent_checkbox: boolean
          consent_ip_hash: string | null
          consent_ip_raw_deprecated: string
          consent_text_hash: string | null
          consent_text_version: string | null
          consent_timestamp: string
          created_at: string
          created_by: string
          document_hash: string
          document_url: string
          id: string
          organization_id: string
          revoked_at: string | null
          revoked_by: string | null
          revoked_reason: string | null
          scope: string
          scope_assets: string[] | null
          scope_cidrs: string[] | null
          scope_domains: string[] | null
          scope_type: string | null
          status: Database["public"]["Enums"]["authorization_status"]
          target_rules: Json | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          consent_checkbox?: boolean
          consent_ip_hash?: string | null
          consent_ip_raw_deprecated: string
          consent_text_hash?: string | null
          consent_text_version?: string | null
          consent_timestamp?: string
          created_at?: string
          created_by: string
          document_hash: string
          document_url: string
          id?: string
          organization_id: string
          revoked_at?: string | null
          revoked_by?: string | null
          revoked_reason?: string | null
          scope: string
          scope_assets?: string[] | null
          scope_cidrs?: string[] | null
          scope_domains?: string[] | null
          scope_type?: string | null
          status?: Database["public"]["Enums"]["authorization_status"]
          target_rules?: Json | null
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          consent_checkbox?: boolean
          consent_ip_hash?: string | null
          consent_ip_raw_deprecated?: string
          consent_text_hash?: string | null
          consent_text_version?: string | null
          consent_timestamp?: string
          created_at?: string
          created_by?: string
          document_hash?: string
          document_url?: string
          id?: string
          organization_id?: string
          revoked_at?: string | null
          revoked_by?: string | null
          revoked_reason?: string | null
          scope?: string
          scope_assets?: string[] | null
          scope_cidrs?: string[] | null
          scope_domains?: string[] | null
          scope_type?: string | null
          status?: Database["public"]["Enums"]["authorization_status"]
          target_rules?: Json | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "authorizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_controls: {
        Row: {
          category: string | null
          control_id: string
          created_at: string
          description: string | null
          framework: Database["public"]["Enums"]["compliance_framework"]
          id: string
          title: string
        }
        Insert: {
          category?: string | null
          control_id: string
          created_at?: string
          description?: string | null
          framework: Database["public"]["Enums"]["compliance_framework"]
          id?: string
          title: string
        }
        Update: {
          category?: string | null
          control_id?: string
          created_at?: string
          description?: string | null
          framework?: Database["public"]["Enums"]["compliance_framework"]
          id?: string
          title?: string
        }
        Relationships: []
      }
      control_mappings: {
        Row: {
          assigned_to: string | null
          control_id: string
          created_at: string
          due_date: string | null
          evidence_notes: string | null
          id: string
          organization_id: string
          status: Database["public"]["Enums"]["control_status"]
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          control_id: string
          created_at?: string
          due_date?: string | null
          evidence_notes?: string | null
          id?: string
          organization_id: string
          status?: Database["public"]["Enums"]["control_status"]
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          control_id?: string
          created_at?: string
          due_date?: string | null
          evidence_notes?: string | null
          id?: string
          organization_id?: string
          status?: Database["public"]["Enums"]["control_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "control_mappings_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "compliance_controls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "control_mappings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      data_sources: {
        Row: {
          category: string
          confidence_score: number | null
          config: Json
          created_at: string
          id: string
          last_sync_at: string | null
          name: string
          organization_id: string
          source_type: string
          status: string
          updated_at: string
        }
        Insert: {
          category: string
          confidence_score?: number | null
          config?: Json
          created_at?: string
          id?: string
          last_sync_at?: string | null
          name: string
          organization_id: string
          source_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          confidence_score?: number | null
          config?: Json
          created_at?: string
          id?: string
          last_sync_at?: string | null
          name?: string
          organization_id?: string
          source_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_sources_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          authorization_id: string | null
          created_at: string
          created_by: string
          document_type: string
          file_hash: string
          file_url: string
          framework: Database["public"]["Enums"]["compliance_framework"] | null
          id: string
          organization_id: string
          title: string
          updated_at: string
        }
        Insert: {
          authorization_id?: string | null
          created_at?: string
          created_by: string
          document_type: string
          file_hash: string
          file_url: string
          framework?: Database["public"]["Enums"]["compliance_framework"] | null
          id?: string
          organization_id: string
          title: string
          updated_at?: string
        }
        Update: {
          authorization_id?: string | null
          created_at?: string
          created_by?: string
          document_type?: string
          file_hash?: string
          file_url?: string
          framework?: Database["public"]["Enums"]["compliance_framework"] | null
          id?: string
          organization_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_authorization_id_fkey"
            columns: ["authorization_id"]
            isOneToOne: false
            referencedRelation: "authorizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_chain_state: {
        Row: {
          last_hash: string
          last_seq: number
          organization_id: string
        }
        Insert: {
          last_hash?: string
          last_seq?: number
          organization_id: string
        }
        Update: {
          last_hash?: string
          last_seq?: number
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_chain_state_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence_log: {
        Row: {
          action: string
          artifact_hash: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          entry_hash: string | null
          id: string
          ip_address: string | null
          organization_id: string
          prev_hash: string | null
          seq: number | null
          source: string
          user_id: string | null
        }
        Insert: {
          action: string
          artifact_hash?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          entry_hash?: string | null
          id?: string
          ip_address?: string | null
          organization_id: string
          prev_hash?: string | null
          seq?: number | null
          source?: string
          user_id?: string | null
        }
        Update: {
          action?: string
          artifact_hash?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          entry_hash?: string | null
          id?: string
          ip_address?: string | null
          organization_id?: string
          prev_hash?: string | null
          seq?: number | null
          source?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      finding_control_links: {
        Row: {
          control_id: string
          created_at: string
          finding_id: string
          framework: Database["public"]["Enums"]["compliance_framework"]
          id: string
          reason: string | null
        }
        Insert: {
          control_id: string
          created_at?: string
          finding_id: string
          framework: Database["public"]["Enums"]["compliance_framework"]
          id?: string
          reason?: string | null
        }
        Update: {
          control_id?: string
          created_at?: string
          finding_id?: string
          framework?: Database["public"]["Enums"]["compliance_framework"]
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "finding_control_links_control_id_fkey"
            columns: ["control_id"]
            isOneToOne: false
            referencedRelation: "compliance_controls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "finding_control_links_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings"
            referencedColumns: ["id"]
          },
        ]
      }
      findings: {
        Row: {
          asset_id: string | null
          confidence: string
          evidence: Json | null
          finding_type: string
          fingerprint: string | null
          first_seen: string
          id: string
          organization_id: string
          references: string[] | null
          severity: Database["public"]["Enums"]["risk_level"]
          status: string
          title: string
          tool_run_id: string
          updated_at: string
        }
        Insert: {
          asset_id?: string | null
          confidence?: string
          evidence?: Json | null
          finding_type?: string
          fingerprint?: string | null
          first_seen?: string
          id?: string
          organization_id: string
          references?: string[] | null
          severity?: Database["public"]["Enums"]["risk_level"]
          status?: string
          title: string
          tool_run_id: string
          updated_at?: string
        }
        Update: {
          asset_id?: string | null
          confidence?: string
          evidence?: Json | null
          finding_type?: string
          fingerprint?: string | null
          first_seen?: string
          id?: string
          organization_id?: string
          references?: string[] | null
          severity?: Database["public"]["Enums"]["risk_level"]
          status?: string
          title?: string
          tool_run_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "findings_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "findings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "findings_tool_run_id_fkey"
            columns: ["tool_run_id"]
            isOneToOne: false
            referencedRelation: "tool_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          permanent_authorization_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          permanent_authorization_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          permanent_authorization_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizations_permanent_authorization_id_fkey"
            columns: ["permanent_authorization_id"]
            isOneToOne: false
            referencedRelation: "authorizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          organization_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          organization_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          organization_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      proof_packs: {
        Row: {
          created_at: string
          created_by: string
          id: string
          organization_id: string
          pack_hash: string
          pack_json: Json
          report_id: string | null
          scope: string | null
          status: string
          tool_run_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          organization_id: string
          pack_hash: string
          pack_json?: Json
          report_id?: string | null
          scope?: string | null
          status?: string
          tool_run_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          organization_id?: string
          pack_hash?: string
          pack_json?: Json
          report_id?: string | null
          scope?: string | null
          status?: string
          tool_run_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proof_packs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proof_packs_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proof_packs_tool_run_id_fkey"
            columns: ["tool_run_id"]
            isOneToOne: false
            referencedRelation: "tool_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      remediation_actions: {
        Row: {
          action_type: string
          created_at: string
          due_date: string | null
          expected_gain: string
          id: string
          implementation_notes: string
          organization_id: string
          owner: string | null
          priority: string
          risk_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          action_type: string
          created_at?: string
          due_date?: string | null
          expected_gain?: string
          id?: string
          implementation_notes?: string
          organization_id: string
          owner?: string | null
          priority?: string
          risk_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          action_type?: string
          created_at?: string
          due_date?: string | null
          expected_gain?: string
          id?: string
          implementation_notes?: string
          organization_id?: string
          owner?: string | null
          priority?: string
          risk_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "remediation_actions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remediation_actions_risk_id_fkey"
            columns: ["risk_id"]
            isOneToOne: false
            referencedRelation: "risk_register"
            referencedColumns: ["id"]
          },
        ]
      }
      remediation_tasks: {
        Row: {
          closed_at: string | null
          created_at: string
          created_by: string
          description: string | null
          due_date: string | null
          finding_id: string | null
          id: string
          organization_id: string
          owner_id: string | null
          priority: Database["public"]["Enums"]["risk_level"]
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          due_date?: string | null
          finding_id?: string | null
          id?: string
          organization_id: string
          owner_id?: string | null
          priority?: Database["public"]["Enums"]["risk_level"]
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string | null
          finding_id?: string | null
          id?: string
          organization_id?: string
          owner_id?: string | null
          priority?: Database["public"]["Enums"]["risk_level"]
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "remediation_tasks_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "findings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "remediation_tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          created_by: string
          evidence_refs: Json | null
          executive_json: Json | null
          executive_md: string | null
          fact_pack_hash: string | null
          id: string
          model_limits: Json | null
          organization_id: string
          status: string
          technical_json: Json | null
          technical_md: string | null
          tool_run_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          evidence_refs?: Json | null
          executive_json?: Json | null
          executive_md?: string | null
          fact_pack_hash?: string | null
          id?: string
          model_limits?: Json | null
          organization_id: string
          status?: string
          technical_json?: Json | null
          technical_md?: string | null
          tool_run_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          evidence_refs?: Json | null
          executive_json?: Json | null
          executive_md?: string | null
          fact_pack_hash?: string | null
          id?: string
          model_limits?: Json | null
          organization_id?: string
          status?: string
          technical_json?: Json | null
          technical_md?: string | null
          tool_run_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_tool_run_id_fkey"
            columns: ["tool_run_id"]
            isOneToOne: true
            referencedRelation: "tool_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      retention_policies: {
        Row: {
          artifacts_years: number
          created_at: string
          id: string
          logs_detail_months: number
          organization_id: string
          reports_years: number
          updated_at: string
        }
        Insert: {
          artifacts_years?: number
          created_at?: string
          id?: string
          logs_detail_months?: number
          organization_id: string
          reports_years?: number
          updated_at?: string
        }
        Update: {
          artifacts_years?: number
          created_at?: string
          id?: string
          logs_detail_months?: number
          organization_id?: string
          reports_years?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "retention_policies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      risk_register: {
        Row: {
          asset_id: string | null
          business_impact: string
          created_at: string
          description: string
          due_date: string | null
          id: string
          organization_id: string
          owner: string | null
          risk_level: string
          score: number
          source_signal_ids: Json
          status: string
          technical_impact: string
          title: string
          updated_at: string
        }
        Insert: {
          asset_id?: string | null
          business_impact?: string
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          organization_id: string
          owner?: string | null
          risk_level?: string
          score?: number
          source_signal_ids?: Json
          status?: string
          technical_impact?: string
          title: string
          updated_at?: string
        }
        Update: {
          asset_id?: string | null
          business_impact?: string
          created_at?: string
          description?: string
          due_date?: string | null
          id?: string
          organization_id?: string
          owner?: string | null
          risk_level?: string
          score?: number
          source_signal_ids?: Json
          status?: string
          technical_impact?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "risk_register_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "risk_register_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      scans: {
        Row: {
          asset_id: string | null
          authorization_id: string | null
          completed_at: string | null
          created_at: string
          created_by: string
          critical_count: number | null
          findings_count: number | null
          high_count: number | null
          id: string
          low_count: number | null
          medium_count: number | null
          organization_id: string
          raw_data: Json | null
          scan_type: Database["public"]["Enums"]["scan_type"]
          started_at: string | null
          status: string
          target_identifier: string | null
        }
        Insert: {
          asset_id?: string | null
          authorization_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by: string
          critical_count?: number | null
          findings_count?: number | null
          high_count?: number | null
          id?: string
          low_count?: number | null
          medium_count?: number | null
          organization_id: string
          raw_data?: Json | null
          scan_type: Database["public"]["Enums"]["scan_type"]
          started_at?: string | null
          status?: string
          target_identifier?: string | null
        }
        Update: {
          asset_id?: string | null
          authorization_id?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string
          critical_count?: number | null
          findings_count?: number | null
          high_count?: number | null
          id?: string
          low_count?: number | null
          medium_count?: number | null
          organization_id?: string
          raw_data?: Json | null
          scan_type?: Database["public"]["Enums"]["scan_type"]
          started_at?: string | null
          status?: string
          target_identifier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scans_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scans_authorization_id_fkey"
            columns: ["authorization_id"]
            isOneToOne: false
            referencedRelation: "authorizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      secrets_vault: {
        Row: {
          created_at: string
          created_by: string
          id: string
          key_name: string
          key_type: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          key_name: string
          key_type: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          key_name?: string
          key_type?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "secrets_vault_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      signals: {
        Row: {
          asset_id: string | null
          category: string
          confidence_score: number | null
          created_at: string
          dedupe_key: string | null
          description: string
          detected_at: string
          evidence: Json
          id: string
          organization_id: string
          raw_payload: Json
          severity: string
          signal_refs: Json
          signal_type: string
          source_id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          asset_id?: string | null
          category: string
          confidence_score?: number | null
          created_at?: string
          dedupe_key?: string | null
          description?: string
          detected_at?: string
          evidence?: Json
          id?: string
          organization_id: string
          raw_payload?: Json
          severity?: string
          signal_refs?: Json
          signal_type: string
          source_id: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          asset_id?: string | null
          category?: string
          confidence_score?: number | null
          created_at?: string
          dedupe_key?: string | null
          description?: string
          detected_at?: string
          evidence?: Json
          id?: string
          organization_id?: string
          raw_payload?: Json
          severity?: string
          signal_refs?: Json
          signal_type?: string
          source_id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "signals_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "signals_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      source_sync_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          items_normalized: number
          items_received: number
          organization_id: string
          raw_summary: Json
          source_id: string
          started_at: string
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          items_normalized?: number
          items_received?: number
          organization_id: string
          raw_summary?: Json
          source_id: string
          started_at?: string
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          items_normalized?: number
          items_received?: number
          organization_id?: string
          raw_summary?: Json
          source_id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_sync_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_sync_runs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "data_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      task_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          id: string
          organization_id: string
          task_id: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          id?: string
          organization_id: string
          task_id: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          id?: string
          organization_id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_comments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_comments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "remediation_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_presets: {
        Row: {
          created_at: string
          default_params: Json | null
          id: string
          mode: string
          name: string
          requires_authorization: boolean
          tool_id: string
        }
        Insert: {
          created_at?: string
          default_params?: Json | null
          id?: string
          mode: string
          name: string
          requires_authorization?: boolean
          tool_id: string
        }
        Update: {
          created_at?: string
          default_params?: Json | null
          id?: string
          mode?: string
          name?: string
          requires_authorization?: boolean
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_presets_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_runs: {
        Row: {
          asset_id: string | null
          authorization_id: string | null
          completed_at: string | null
          created_at: string
          id: string
          input_artifact_hash: string | null
          input_artifact_url: string | null
          mode: string
          normalized_output: Json | null
          organization_id: string
          preset_id: string | null
          requested_at: string
          requested_by: string
          status: string
          summary: Json | null
          target_identifier: string | null
          tool_id: string
        }
        Insert: {
          asset_id?: string | null
          authorization_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          input_artifact_hash?: string | null
          input_artifact_url?: string | null
          mode: string
          normalized_output?: Json | null
          organization_id: string
          preset_id?: string | null
          requested_at?: string
          requested_by: string
          status?: string
          summary?: Json | null
          target_identifier?: string | null
          tool_id: string
        }
        Update: {
          asset_id?: string | null
          authorization_id?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          input_artifact_hash?: string | null
          input_artifact_url?: string | null
          mode?: string
          normalized_output?: Json | null
          organization_id?: string
          preset_id?: string | null
          requested_at?: string
          requested_by?: string
          status?: string
          summary?: Json | null
          target_identifier?: string | null
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_runs_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_runs_authorization_id_fkey"
            columns: ["authorization_id"]
            isOneToOne: false
            referencedRelation: "authorizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_runs_preset_id_fkey"
            columns: ["preset_id"]
            isOneToOne: false
            referencedRelation: "tool_presets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_runs_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      tools_catalog: {
        Row: {
          category: string
          created_at: string
          docker_url: string | null
          docs_url: string
          id: string
          name: string
          official_site_url: string
          repo_url: string
          slug: string
          status: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          docker_url?: string | null
          docs_url: string
          id?: string
          name: string
          official_site_url: string
          repo_url: string
          slug: string
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          docker_url?: string | null
          docs_url?: string
          id?: string
          name?: string
          official_site_url?: string
          repo_url?: string
          slug?: string
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authorization_belongs_to_org: {
        Args: { _auth_id: string; _org_id: string }
        Returns: boolean
      }
      calculate_risk_score: {
        Args: { confidence_score?: number; severity: string }
        Returns: number
      }
      ensure_permanent_authorization: {
        Args: { _org_id: string; _user_id: string }
        Returns: string
      }
      get_default_authorization_id: {
        Args: { _org_id: string }
        Returns: string
      }
      get_my_org_id: { Args: never; Returns: string }
      get_platform_health: { Args: { _org_id: string }; Returns: Json }
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
      has_consent_proof: { Args: { _auth_id: string }; Returns: boolean }
      has_org_access: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _org_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_valid_authorization: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_authorization_valid: { Args: { _auth_id: string }; Returns: boolean }
      is_target_in_scope: {
        Args: { _auth_id: string; _target: string }
        Returns: boolean
      }
      normalize_severity: { Args: { input_severity: string }; Returns: string }
      normalize_target: { Args: { _target: string }; Returns: string }
      sha256_hex: { Args: { input: string }; Returns: string }
      verify_evidence_chain: {
        Args: { _org_id: string }
        Returns: {
          expected_hash: string
          first_bad_seq: number
          found_hash: string
          head_hash: string
          is_valid: boolean
          last_seq: number
          legacy_rows_count: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "auditor" | "user"
      authorization_status: "pending" | "approved" | "expired" | "revoked"
      compliance_framework: "gdpr" | "nis2"
      control_status:
        | "not_started"
        | "in_progress"
        | "implemented"
        | "not_applicable"
      risk_level: "critical" | "high" | "medium" | "low" | "info"
      scan_type:
        | "vulnerability"
        | "asset_discovery"
        | "document_import"
        | "compliance_check"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "auditor", "user"],
      authorization_status: ["pending", "approved", "expired", "revoked"],
      compliance_framework: ["gdpr", "nis2"],
      control_status: [
        "not_started",
        "in_progress",
        "implemented",
        "not_applicable",
      ],
      risk_level: ["critical", "high", "medium", "low", "info"],
      scan_type: [
        "vulnerability",
        "asset_discovery",
        "document_import",
        "compliance_check",
      ],
    },
  },
} as const
