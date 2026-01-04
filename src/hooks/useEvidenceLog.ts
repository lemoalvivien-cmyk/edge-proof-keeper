import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { EvidenceLog } from '@/types/database';

// Re-export the type from database.ts
export type ExtendedEvidenceLog = EvidenceLog;

const PAGE_SIZE = 50;

interface EvidenceLogFilters {
  action?: string;
  entity_type?: string;
}

interface EvidenceLogPage {
  data: ExtendedEvidenceLog[];
  nextCursor: { seq: number | null; created_at: string } | null;
  hasMore: boolean;
}

export function useEvidenceLogPaginated(filters?: EvidenceLogFilters) {
  const { organization } = useAuth();

  return useInfiniteQuery<EvidenceLogPage, Error>({
    queryKey: ['evidence_log', organization?.id, filters],
    queryFn: async ({ pageParam }) => {
      if (!organization?.id) {
        return { data: [], nextCursor: null, hasMore: false };
      }
      
      let query = supabase
        .from('evidence_log')
        .select('*')
        .eq('organization_id', organization.id)
        .order('seq', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE + 1);

      // Apply filters
      if (filters?.action) {
        query = query.eq('action', filters.action);
      }
      if (filters?.entity_type) {
        query = query.eq('entity_type', filters.entity_type);
      }

      // Cursor-based pagination using seq and created_at
      if (pageParam) {
        const cursor = pageParam as { seq: number | null; created_at: string };
        if (cursor.seq !== null) {
          // Use seq for keyset pagination when available
          query = query.lt('seq', cursor.seq);
        } else {
          // Fall back to created_at for legacy entries without seq
          query = query.lt('created_at', cursor.created_at);
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const hasMore = data.length > PAGE_SIZE;
      const items = hasMore ? data.slice(0, PAGE_SIZE) : data;
      
      let nextCursor: { seq: number | null; created_at: string } | null = null;
      if (hasMore && items.length > 0) {
        const lastItem = items[items.length - 1];
        nextCursor = {
          seq: lastItem.seq ?? null,
          created_at: lastItem.created_at,
        };
      }

      return {
        data: items as ExtendedEvidenceLog[],
        nextCursor,
        hasMore,
      };
    },
    initialPageParam: null as { seq: number | null; created_at: string } | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: !!organization?.id,
  });
}

// Keep the old hook for backwards compatibility
export function useEvidenceLog() {
  const { organization } = useAuth();
  const query = useEvidenceLogPaginated();

  // Flatten all pages into a single array
  const logs = query.data?.pages.flatMap(page => page.data) ?? [];

  return {
    logs,
    isLoading: query.isLoading,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}
