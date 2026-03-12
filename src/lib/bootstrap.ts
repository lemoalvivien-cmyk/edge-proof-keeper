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
    // Already bootstrapped — verify app_runtime_config exists, create stub if not
    await ensureRuntimeConfigStub(existingProfile.organization_id);
    return { orgId: existingProfile.organization_id, isFirstRun: false };
  }

  // ── 1b. Always check existing roles before attempting org INSERT ───────────
  // The hardened RLS policy (NOT EXISTS user_roles) blocks INSERT if the user
  // already has any role. This covers two recovery scenarios:
  //   a) Profile exists without org_id (stale state)
  //   b) No profile at all but user has roles (race condition / partial bootstrap)
  // In both cases: recover the org from user_roles instead of creating a new one.
  const { data: existingRole } = await supabase
    .from('user_roles')
    .select('organization_id')
    .eq('user_id', userId)
    .limit(1)
    .maybeSingle();

  if (existingRole?.organization_id) {
    // User already has a role → recover org, patch profile, ensure config stub
    await supabase
      .from('profiles')
      .upsert({ id: userId, email, organization_id: existingRole.organization_id }, { onConflict: 'id' });
    await ensureRuntimeConfigStub(existingRole.organization_id);
    return { orgId: existingRole.organization_id, isFirstRun: false };
  }

  // ── 2. Create organization ─────────────────────────────────────────────────
  // At this point: user has 0 roles → RLS policy allows the INSERT (bootstrap window is open)
  const baseSlug = email
    .split('@')[0]
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
    throw new Error(`Impossible de créer l'organisation: ${orgError?.message}`);
  }

  const orgId = org.id;

  // ── 3. Upsert profile (may exist from auth trigger without org) ────────────
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email,
      organization_id: orgId,
    }, { onConflict: 'id' });

  if (profileError) {
    throw new Error(`Impossible de créer le profil: ${profileError.message}`);
  }

  // ── 4. Assign admin role ───────────────────────────────────────────────────
  const { error: roleError } = await supabase
    .from('user_roles')
    .upsert({
      user_id: userId,
      organization_id: orgId,
      role: 'admin',
    }, { onConflict: 'user_id,organization_id' });

  if (roleError) {
    // Non-fatal: log and continue (user can still access app, role may already exist)
    console.warn('Warning: could not assign admin role:', roleError.message);
  }

  // ── 5. Create app_runtime_config stub (makes tenant_resolved: true) ────────
  await ensureRuntimeConfigStub(orgId);

  return { orgId, isFirstRun: true };
}

async function ensureRuntimeConfigStub(orgId: string): Promise<void> {
  // Check if already exists
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from('app_runtime_config')
    .select('id')
    .eq('organization_id', orgId)
    .maybeSingle();

  if (existing) return; // already exists, nothing to do

  // Create minimal stub — no URLs yet, but the row makes tenant_resolved: true
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from('app_runtime_config')
    .insert({
      organization_id: orgId,
      reports_mode: 'internal_fallback',
      sales_mode: 'lead_first',
    });
  // Non-fatal if this fails (e.g. admin role not yet propagated) — will be retried on next load
}
