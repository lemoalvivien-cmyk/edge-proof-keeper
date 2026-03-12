/**
 * usePublicTenantConfig
 *
 * Fetches commercial CTA config from the public edge function `get-public-config`.
 * Works for unauthenticated (public) visitors.
 *
 * Resolution chain (explicit, testable):
 *   1. Edge function → DB (app_runtime_config or commercial_config via service role)
 *   2. Env vars fallback (when tenant_resolved=false or fetch fails)
 *
 * configSource values:
 *   "app_runtime_config" — came from DB primary table
 *   "commercial_config"  — came from DB legacy table
 *   "env"                — edge fn returned nothing, fell back to env vars
 *   "none"               — no config anywhere
 *
 * tenantResolved:
 *   true  — at least one organization was found in DB
 *   false — no org found (first-run, tenant not set up)
 */

import { useQuery } from '@tanstack/react-query';

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID as string;
const SUPABASE_ANON_KEY   = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

const EDGE_URL = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/get-public-config`;

/** Fields exposed by the edge function */
export interface PublicTenantConfigRaw {
  booking_url:             string | null;
  starter_checkout_url:    string | null;
  pro_checkout_url:        string | null;
  enterprise_checkout_url: string | null;
  sales_mode:              string;
  config_source:           'app_runtime_config' | 'commercial_config' | 'none';
  tenant_resolved:         boolean;
  tenant_slug:             string | null;
}

/** Normalised shape consumed by usePublicCta */
export interface PublicTenantConfig {
  bookingUrl:             string | null;
  starterCheckoutUrl:     string | null;
  proCheckoutUrl:         string | null;
  enterpriseCheckoutUrl:  string | null;
  salesMode:              string;
  /**
   * Explicit, testable source label:
   *   "db:app_runtime_config" | "db:commercial_config" | "env" | "none"
   */
  configSource:           string;
  tenantResolved:         boolean;
  tenantSlug:             string | null;
  isLoading:              boolean;
  isError:                boolean;
}

const ENV_FALLBACK = {
  bookingUrl:             (import.meta.env.VITE_BOOKING_URL             as string | undefined) || null,
  starterCheckoutUrl:     (import.meta.env.VITE_STARTER_CHECKOUT_URL    as string | undefined) || null,
  proCheckoutUrl:         (import.meta.env.VITE_PRO_CHECKOUT_URL        as string | undefined) || null,
  enterpriseCheckoutUrl:  (import.meta.env.VITE_ENTERPRISE_CHECKOUT_URL as string | undefined) || null,
};

async function fetchPublicConfig(slug?: string): Promise<PublicTenantConfigRaw> {
  const url = slug ? `${EDGE_URL}?slug=${encodeURIComponent(slug)}` : EDGE_URL;
  const res = await fetch(url, {
    headers: { apikey: SUPABASE_ANON_KEY },
  });
  if (!res.ok) throw new Error(`get-public-config: ${res.status}`);
  return res.json();
}

function normalise(raw: PublicTenantConfigRaw): PublicTenantConfig {
  const dbHasAny =
    raw.booking_url ||
    raw.starter_checkout_url ||
    raw.pro_checkout_url ||
    raw.enterprise_checkout_url;

  // If DB resolved the tenant but has no URLs, use env as secondary fallback
  const effectiveBooking  = raw.booking_url             ?? ENV_FALLBACK.bookingUrl;
  const effectiveStarter  = raw.starter_checkout_url    ?? ENV_FALLBACK.starterCheckoutUrl;
  const effectivePro      = raw.pro_checkout_url        ?? ENV_FALLBACK.proCheckoutUrl;
  const effectiveEnterprise = raw.enterprise_checkout_url ?? ENV_FALLBACK.enterpriseCheckoutUrl;

  // Determine explicit config source for visibility
  let configSource: string;
  if (raw.config_source === 'app_runtime_config') {
    configSource = dbHasAny ? 'db:app_runtime_config' : 'env';
  } else if (raw.config_source === 'commercial_config') {
    configSource = dbHasAny ? 'db:commercial_config' : 'env';
  } else {
    const hasEnv = Object.values(ENV_FALLBACK).some(Boolean);
    configSource = hasEnv ? 'env' : 'none';
  }

  return {
    bookingUrl:            effectiveBooking,
    starterCheckoutUrl:    effectiveStarter,
    proCheckoutUrl:        effectivePro,
    enterpriseCheckoutUrl: effectiveEnterprise,
    salesMode:             raw.sales_mode,
    configSource,
    tenantResolved:        raw.tenant_resolved,
    tenantSlug:            raw.tenant_slug,
    isLoading:             false,
    isError:               false,
  };
}

/**
 * Public hook — safe to call from any component, including unauthenticated ones.
 * slug: optional org slug for future multi-tenant support.
 */
export function usePublicTenantConfig(slug?: string): PublicTenantConfig {
  const { data, isLoading, isError } = useQuery({
    queryKey:  ['public-tenant-config', slug ?? '__default__'],
    queryFn:   () => fetchPublicConfig(slug),
    staleTime: 60 * 1000,          // 1 min — edge fn is cached 60s server-side
    retry:     1,
    // No auth dependency — this is purely public
  });

  if (isLoading) {
    return {
      bookingUrl:            null,
      starterCheckoutUrl:    null,
      proCheckoutUrl:        null,
      enterpriseCheckoutUrl: null,
      salesMode:             'lead_first',
      configSource:          'none',
      tenantResolved:        false,
      tenantSlug:            null,
      isLoading:             true,
      isError:               false,
    };
  }

  if (isError || !data) {
    // Edge function unreachable — fall back to env, be honest about it
    const hasEnv = Object.values(ENV_FALLBACK).some(Boolean);
    return {
      bookingUrl:            ENV_FALLBACK.bookingUrl,
      starterCheckoutUrl:    ENV_FALLBACK.starterCheckoutUrl,
      proCheckoutUrl:        ENV_FALLBACK.proCheckoutUrl,
      enterpriseCheckoutUrl: ENV_FALLBACK.enterpriseCheckoutUrl,
      salesMode:             'lead_first',
      configSource:          hasEnv ? 'env' : 'none',
      tenantResolved:        false,
      tenantSlug:            null,
      isLoading:             false,
      isError:               true,
    };
  }

  return normalise(data);
}
