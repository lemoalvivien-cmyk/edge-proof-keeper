import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProofPack {
  id: string;
  organization_id: string;
  scope: string | null;
  tool_run_id: string | null;
  report_id: string | null;
  status: string;
  pack_json: Record<string, unknown>;
  pack_hash: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChainVerificationResult {
  is_valid: boolean;
  last_seq: number;
  head_hash: string;
  first_bad_seq: number | null;
  has_discrepancy: boolean;
  legacy_rows_count: number;
}

export function useProofPacks() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["proof-packs", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from("proof_packs")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as ProofPack[];
    },
    enabled: !!organization?.id,
  });
}

export function useProofPack(id: string | undefined) {
  return useQuery({
    queryKey: ["proof-pack", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("proof_packs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as ProofPack;
    },
    enabled: !!id,
  });
}

export function useVerifyEvidenceChain() {
  const { organization } = useAuth();

  return useMutation({
    mutationFn: async (): Promise<ChainVerificationResult> => {
      if (!organization?.id) {
        throw new Error("No organization");
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("verify-evidence-chain", {
        body: { organization_id: organization.id },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Verification failed");
      
      return data.verification;
    },
  });
}

export function useExportProofPack() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ tool_run_id, report_id }: { tool_run_id?: string; report_id?: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const { data, error } = await supabase.functions.invoke("export-proof-pack", {
        body: { tool_run_id, report_id },
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.error || "Export failed");
      
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proof-packs"] });
    },
  });
}
