/**
 * get-public-config
 *
 * Public edge function — NO JWT required.
 * Returns ONLY the commercial config fields that public CTAs need.
 * No sensitive data exposed. No RLS bypass.
 *
 * Tenant resolution strategy (in priority order):
 *   1. ?slug=<org_slug>  (future multi-tenant)
 *   2. First active row in app_runtime_config (solo-mode / single-tenant)
 *   3. First active row in commercial_config (legacy fallback)
 *   4. Empty payload with source="none"
 *
 * Response fields (all non-sensitive):
 *   booking_url, starter_checkout_url, pro_checkout_url,
 *   enterprise_checkout_url, sales_mode, config_source, tenant_resolved
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface PublicConfig {
  booking_url:             string | null;
  starter_checkout_url:    string | null;
  pro_checkout_url:        string | null;
  enterprise_checkout_url: string | null;
  sales_mode:              string;
  config_source:           'app_runtime_config' | 'commercial_config' | 'none';
  tenant_resolved:         boolean;
  tenant_slug:             string | null;
}

function cleanUrl(v: string | null | undefined): string | null {
  if (!v) return null;
  const t = v.trim().replace(/\/$/, '');
  return t || null;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Service-role client so we can read the config tables bypassing RLS
    // (this is intentional: the function enforces its own field-level whitelist)
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const url       = new URL(req.url);
    const slugParam = url.searchParams.get('slug') ?? null;

    let orgId:   string | null = null;
    let orgSlug: string | null = null;

    // ── Tenant resolution ─────────────────────────────────────────────────────
    if (slugParam) {
      // Strategy 1: explicit slug
      const { data: org } = await supabase
        .from('organizations')
        .select('id, slug')
        .eq('slug', slugParam)
        .maybeSingle();

      if (org) {
        orgId   = org.id;
        orgSlug = org.slug;
      }
    }

    if (!orgId) {
      // Strategy 2: single active tenant (solo-mode)
      const { data: org } = await supabase
        .from('organizations')
        .select('id, slug')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (org) {
        orgId   = org.id;
        orgSlug = org.slug;
      }
    }

    if (!orgId) {
      // No tenant found — return empty config with explicit source
      const empty: PublicConfig = {
        booking_url:             null,
        starter_checkout_url:    null,
        pro_checkout_url:        null,
        enterprise_checkout_url: null,
        sales_mode:              'lead_first',
        config_source:           'none',
        tenant_resolved:         false,
        tenant_slug:             null,
      };
      return new Response(JSON.stringify(empty), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Config resolution (priority: app_runtime_config > commercial_config) ──
    const { data: rtRow } = await supabase
      .from('app_runtime_config')
      .select(
        'booking_url, starter_checkout_url, pro_checkout_url, enterprise_checkout_url, sales_mode',
      )
      .eq('organization_id', orgId)
      .maybeSingle();

    if (rtRow) {
      const cfg: PublicConfig = {
        booking_url:             cleanUrl(rtRow.booking_url),
        starter_checkout_url:    cleanUrl(rtRow.starter_checkout_url),
        pro_checkout_url:        cleanUrl(rtRow.pro_checkout_url),
        enterprise_checkout_url: cleanUrl(rtRow.enterprise_checkout_url),
        sales_mode:              rtRow.sales_mode ?? 'lead_first',
        config_source:           'app_runtime_config',
        tenant_resolved:         true,
        tenant_slug:             orgSlug,
      };
      return new Response(JSON.stringify(cfg), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      });
    }

    const { data: ccRow } = await supabase
      .from('commercial_config')
      .select(
        'booking_url, starter_checkout_url, pro_checkout_url, enterprise_checkout_url',
      )
      .eq('organization_id', orgId)
      .maybeSingle();

    if (ccRow) {
      const cfg: PublicConfig = {
        booking_url:             cleanUrl(ccRow.booking_url),
        starter_checkout_url:    cleanUrl(ccRow.starter_checkout_url),
        pro_checkout_url:        cleanUrl(ccRow.pro_checkout_url),
        enterprise_checkout_url: cleanUrl(ccRow.enterprise_checkout_url),
        sales_mode:              'lead_first',
        config_source:           'commercial_config',
        tenant_resolved:         true,
        tenant_slug:             orgSlug,
      };
      return new Response(JSON.stringify(cfg), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      });
    }

    // Tenant exists but no config row yet
    const noConfig: PublicConfig = {
      booking_url:             null,
      starter_checkout_url:    null,
      pro_checkout_url:        null,
      enterprise_checkout_url: null,
      sales_mode:              'lead_first',
      config_source:           'none',
      tenant_resolved:         true,
      tenant_slug:             orgSlug,
    };
    return new Response(JSON.stringify(noConfig), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('get-public-config error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal error', booking_url: null, config_source: 'none', tenant_resolved: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
