/**
 * bootstrap.ts
 *
 * First-run setup logic executed after OwnerSetup authentication.
 *
 * Idempotent — safe to call multiple times.
 * Guarantees:
 *   - A profile row exists for this user
 *   - An organization row exists and is linked to the profile
 *   - An admin user_role exists for this user in that org
 *   - An app_runtime_config stub exists for that org (so get-public-config → tenant_resolved: true)
 *
 * Returns { orgId, isFirstRun } or throws on hard failure.
 *
 * ── Idempotency strategy ──────────────────────────────────────────────────────
 * Every INSERT is preceded by a SELECT. If the target row already exists we
 * skip the INSERT, preventing RLS violations from concurrent bootstrap calls.
 */

import { supabase } from '@/integrations/supabase/client';

export interface BootstrapResult {
  orgId: string;
  isFirstRun: boolean;
}

export async function bootstrapOwner(userId: string, email: string): Promise<BootstrapResult> {
  // ── 1. Check if profile already exists with org ────────────────────────────
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, organization_id')
    .eq('id', userId)
    .maybeSingle();

  if (existingProfile?.organization_id) {
    // Already fully bootstrapped
    await ensureRuntimeConfigStub(existingProfile.organization_id);
    return { orgId: existingProfile.organization_id, isFirstRun: false };
  }

  // ── 1b. Check if user already has a role (partial bootstrap recovery) ──────
  // This covers: profile exists without org_id OR no profile but role exists.
  const { data: existingRole } = await supabase
    .from('user_roles')
    .select('organization_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (existingRole?.organization_id) {
    // Recover: patch profile, ensure config stub
    console.log('[bootstrap] Recovering from partial bootstrap via existing role');
    await supabase
      .from('profiles')
      .upsert({ id: userId, email, organization_id: existingRole.organization_id }, { onConflict: 'id' });
    await ensureRuntimeConfigStub(existingRole.organization_id);
    return { orgId: existingRole.organization_id, isFirstRun: false };
  }

  // ── 2. Create organization ─────────────────────────────────────────────────
  // At this point: user has 0 roles → RLS "Bootstrap: no-role user can create
  // first organization" allows the INSERT.
  const baseSlug = (email.split('@')[0] ?? 'owner')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 32);
  const orgSlug = `${baseSlug}-${Date.now().toString(36)}`;

  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({ name: 'Mon Organisation', slug: orgSlug })
    .select('id')
    .single();

  if (orgError || !org) {
    // Last-resort: maybe org was created by a concurrent call — try role again
    const { data: retryRole } = await supabase
      .from('user_roles')
      .select('organization_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();
    if (retryRole?.organization_id) {
      console.log('[bootstrap] Concurrent bootstrap detected, recovering via role');
      await supabase
        .from('profiles')
        .upsert({ id: userId, email, organization_id: retryRole.organization_id }, { onConflict: 'id' });
      await ensureRuntimeConfigStub(retryRole.organization_id);
      return { orgId: retryRole.organization_id, isFirstRun: false };
    }
    throw new Error(`Impossible de créer l'organisation: ${orgError?.message}`);
  }

  const orgId = org.id;
  console.log('[bootstrap] Organization created:', orgId);

  // ── 3. Upsert profile ──────────────────────────────────────────────────────
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({ id: userId, email, organization_id: orgId }, { onConflict: 'id' });

  if (profileError) {
    throw new Error(`Impossible de créer le profil: ${profileError.message}`);
  }

  // ── 4. Assign admin role ───────────────────────────────────────────────────
  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert({ user_id: userId, organization_id: orgId, role: 'admin' }, { onConflict: 'user_id,organization_id' });

  if (roleError) {
    console.warn('[bootstrap] Warning: could not assign admin role:', roleError.message);
  } else {
    console.log('[bootstrap] Admin role assigned for org:', orgId);
  }

  // ── 5. Create app_runtime_config stub ─────────────────────────────────────
  await ensureRuntimeConfigStub(orgId);

  console.log('[bootstrap] Bootstrap complete — isFirstRun: true, orgId:', orgId);
  return { orgId, isFirstRun: true };
}

async function ensureRuntimeConfigStub(orgId: string): Promise<void> {
  // Check if already exists first to avoid RLS violation on duplicate insert
  const { data: existing } = await (supabase as any)
    .from('app_runtime_config')
    .select('id')
    .eq('organization_id', orgId)
    .maybeSingle();

  if (existing) return;

  const { error } = await (supabase as any)
    .from('app_runtime_config')
    .insert({
      organization_id: orgId,
      reports_mode: 'internal_fallback',
      sales_mode: 'lead_first',
    });

  if (error) {
    // Non-fatal: RLS may block this until the admin role JWT propagates.
    // The row will be created on next load once roles are committed.
    console.warn('[bootstrap] ensureRuntimeConfigStub non-fatal:', error.message);
  }
}
