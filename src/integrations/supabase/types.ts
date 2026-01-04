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
          consent_checkbox: boolean
          consent_ip: string
          consent_timestamp: string
          created_at: string
          created_by: string
          document_hash: string
          document_url: string
          id: string
          organization_id: string
          scope: string
          status: Database["public"]["Enums"]["authorization_status"]
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          consent_checkbox?: boolean
          consent_ip: string
          consent_timestamp?: string
          created_at?: string
          created_by: string
          document_hash: string
          document_url: string
          id?: string
          organization_id: string
          scope: string
          status?: Database["public"]["Enums"]["authorization_status"]
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          consent_checkbox?: boolean
          consent_ip?: string
          consent_timestamp?: string
          created_at?: string
          created_by?: string
          document_hash?: string
          document_url?: string
          id?: string
          organization_id?: string
          scope?: string
          status?: Database["public"]["Enums"]["authorization_status"]
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
      evidence_log: {
        Row: {
          action: string
          artifact_hash: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          organization_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          artifact_hash?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          organization_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          artifact_hash?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          organization_id?: string
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
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
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
      scans: {
        Row: {
          asset_id: string | null
          authorization_id: string
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
        }
        Insert: {
          asset_id?: string | null
          authorization_id: string
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
        }
        Update: {
          asset_id?: string | null
          authorization_id?: string
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
      get_user_org_id: { Args: { _user_id: string }; Returns: string }
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
