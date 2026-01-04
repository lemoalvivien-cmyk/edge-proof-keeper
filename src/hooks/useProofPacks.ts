import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
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

const PAGE_SIZE = 25;

interface ProofPacksPage {
  data: ProofPack[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function useProofPacksPaginated() {
  const { organization } = useAuth();

  return useInfiniteQuery<ProofPacksPage, Error>({
    queryKey: ["proof-packs", organization?.id],
    queryFn: async ({ pageParam }) => {
      if (!organization?.id) {
        return { data: [], nextCursor: null, hasMore: false };
      }
      
      let query = supabase
        .from("proof_packs")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE + 1); // Fetch one extra to check if there's more

      // If we have a cursor, filter to items older than it
      if (pageParam) {
        query = query.lt("created_at", pageParam);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const hasMore = data.length > PAGE_SIZE;
      const items = hasMore ? data.slice(0, PAGE_SIZE) : data;
      const nextCursor = hasMore && items.length > 0 
        ? items[items.length - 1].created_at 
        : null;

      return {
        data: items as ProofPack[],
        nextCursor,
        hasMore,
      };
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!organization?.id,
  });
}

// Keep the old hook for backwards compatibility but deprecate it
export function useProofPacks() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["proof-packs-legacy", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return [];
      
      const { data, error } = await supabase
        .from("proof_packs")
        .select("*")
        .eq("organization_id", organization.id)
        .order("created_at", { ascending: false })
        .limit(100);

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
