/**
 * bootstrap-owner/index.ts
 *
 * Edge Function — Bootstrap du premier propriétaire de tenant.
 *
 * Utilise le service_role key pour contourner la RLS côté client
 * tout en validant le JWT entrant pour identifier l'utilisateur réel.
 *
 * Idempotent : peut être appelée plusieurs fois sans effet de bord.
 *
 * Retourne : { orgId, isFirstRun, profile, roles }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // ── 1. Validate caller identity via JWT ────────────────────────────────────
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use anon client with the user's token to extract user identity
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', detail: authError?.message }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = user.id;
    const email = user.email ?? '';

    console.log('[bootstrap-owner] Authenticated user:', userId, email);

    // ── 2. Use service_role client — bypasses RLS entirely ────────────────────
    const admin = createClient(supabaseUrl, supabaseServiceKey);

    // ── 3. Check if profile already exists with org ───────────────────────────
    const { data: existingProfile } = await admin
      .from('profiles')
      .select('id, organization_id')
      .eq('id', userId)
      .maybeSingle();

    if (existingProfile?.organization_id) {
      const orgId = existingProfile.organization_id;
      console.log('[bootstrap-owner] Already bootstrapped, orgId:', orgId);
      await ensureRuntimeConfig(admin, orgId);

      const { data: roles } = await admin
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('organization_id', orgId);

      return new Response(JSON.stringify({
        orgId,
        isFirstRun: false,
        userId,
        email,
        roles: roles?.map(r => r.role) ?? [],
      }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── 4. Check if role exists (partial bootstrap recovery) ─────────────────
    const { data: existingRole } = await admin
      .from('user_roles')
      .select('organization_id')
      .eq('user_id', userId)
      .limit(1)
      .maybeSingle();

    if (existingRole?.organization_id) {
      const orgId = existingRole.organization_id;
      console.log('[bootstrap-owner] Recovery via existing role, orgId:', orgId);
      await admin.from('profiles').upsert(
        { id: userId, email, organization_id: orgId },
        { onConflict: 'id' }
      );
      await ensureRuntimeConfig(admin, orgId);
      return new Response(JSON.stringify({ orgId, isFirstRun: false, userId, email, roles: ['admin'] }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── 5. Create organization ─────────────────────────────────────────────────
    const baseSlug = (email.split('@')[0] ?? 'owner')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 32);
    const orgSlug = `${baseSlug}-${Date.now().toString(36)}`;

    const { data: org, error: orgError } = await admin
      .from('organizations')
      .insert({ name: 'Mon Organisation', slug: orgSlug })
      .select('id')
      .single();

    if (orgError || !org) {
      throw new Error(`Failed to create organization: ${orgError?.message}`);
    }

    const orgId = org.id;
    console.log('[bootstrap-owner] Organization created:', orgId);

    // ── 6. Upsert profile ──────────────────────────────────────────────────────
    const { error: profileError } = await admin
      .from('profiles')
      .upsert({ id: userId, email, organization_id: orgId }, { onConflict: 'id' });

    if (profileError) {
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }

    // ── 7. Assign admin role ───────────────────────────────────────────────────
    const { error: roleError } = await admin
      .from('user_roles')
      .upsert(
        { user_id: userId, organization_id: orgId, role: 'admin' },
        { onConflict: 'user_id,organization_id' }
      );

    if (roleError) {
      console.warn('[bootstrap-owner] Role assignment warning:', roleError.message);
    } else {
      console.log('[bootstrap-owner] Admin role assigned');
    }

    // ── 8. Create app_runtime_config stub ─────────────────────────────────────
    await ensureRuntimeConfig(admin, orgId);

    console.log('[bootstrap-owner] Bootstrap complete — isFirstRun: true, orgId:', orgId);

    return new Response(JSON.stringify({
      orgId,
      isFirstRun: true,
      userId,
      email,
      roles: ['admin'],
    }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[bootstrap-owner] Fatal error:', msg);
    return new Response(JSON.stringify({ error: 'Bootstrap failed', detail: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function ensureRuntimeConfig(admin: ReturnType<typeof createClient>, orgId: string) {
  const { data: existing } = await admin
    .from('app_runtime_config')
    .select('id')
    .eq('organization_id', orgId)
    .maybeSingle();

  if (existing) return;

  await admin.from('app_runtime_config').insert({
    organization_id: orgId,
    reports_mode: 'internal_fallback',
    sales_mode: 'lead_first',
  });
}
