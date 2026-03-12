/**
 * bootstrap.ts
 *
 * Client-side bootstrap — calls the bootstrap-owner Edge Function which uses
 * service_role key to bypass RLS. This eliminates all client-side RLS race
 * conditions that blocked org creation when auth.uid() was stale or null.
 *
 * Idempotent — safe to call multiple times.
 */

import { supabase } from '@/integrations/supabase/client';

export interface BootstrapResult {
  orgId: string;
  isFirstRun: boolean;
}

export async function bootstrapOwner(userId: string, _email: string): Promise<BootstrapResult> {
  // Get current session token for the Edge Function call
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error('No active session — cannot bootstrap without valid JWT');
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const response = await fetch(`${supabaseUrl}/functions/v1/bootstrap-owner`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Bootstrap failed (${response.status}): ${body.error ?? body.detail ?? 'Unknown'}`);
  }

  const result = await response.json();

  console.log('[bootstrap] Edge Function result:', {
    orgId: result.orgId,
    isFirstRun: result.isFirstRun,
    userId: result.userId,
    roles: result.roles,
  });

  return {
    orgId: result.orgId,
    isFirstRun: result.isFirstRun ?? false,
  };
}
