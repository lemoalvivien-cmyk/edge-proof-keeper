/**
 * useRuntimeConfig
 *
 * Priority order:
 *   1. app_runtime_config (DB, admin-editable at /settings/revenue)
 *   2. commercial_config  (DB, legacy table — booking + checkout only)
 *   3. Vite env vars      (build-time fallback)
 *   4. safe defaults      (always operational)
 *
 * Returns a stable object. Never throws. Components stay functional even when
 * all env vars are absent.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type ReportsMode = 'external_only' | 'internal_fallback' | 'internal_only';
export type SalesMode   = 'lead_first' | 'checkout_first' | 'booking_first' | 'disabled';

export interface RuntimeConfig {
  // Backend / AI
  coreApiUrl:           string | null;
  aiGatewayUrl:         string | null;
  reportsMode:          ReportsMode;
  salesMode:            SalesMode;
  // Commercial
  bookingUrl:           string | null;
  starterCheckoutUrl:   string | null;
  proCheckoutUrl:       string | null;
  enterpriseCheckoutUrl: string | null;
  supportEmail:         string | null;
  salesEnabled:         boolean;
  /** Which table provided the config (null = env/defaults only) */
  configSource:         'app_runtime_config' | 'commercial_config' | 'env' | 'defaults';
  isLoading:            boolean;
}

const ENV = {
  coreApiUrl:           (import.meta.env.VITE_CORE_API_URL            as string | undefined) || null,
  aiGatewayUrl:         (import.meta.env.VITE_AI_GATEWAY_URL          as string | undefined) || null,
  bookingUrl:           (import.meta.env.VITE_BOOKING_URL             as string | undefined) || null,
  starterCheckoutUrl:   (import.meta.env.VITE_STARTER_CHECKOUT_URL    as string | undefined) || null,
  proCheckoutUrl:       (import.meta.env.VITE_PRO_CHECKOUT_URL        as string | undefined) || null,
  enterpriseCheckoutUrl:(import.meta.env.VITE_ENTERPRISE_CHECKOUT_URL as string | undefined) || null,
};

// Normalise URL: trim trailing slashes; return null if empty.
function cleanUrl(v: string | null | undefined): string | null {
  if (!v) return null;
  const trimmed = v.trim().replace(/\/$/, '');
  return trimmed || null;
}

export function useRuntimeConfig(): RuntimeConfig {
  const { organization } = useAuth();
  const orgId = organization?.id ?? null;

  // Fetch app_runtime_config (primary)
  const { data: rtRow, isLoading: rtLoading } = useQuery({
    queryKey: ['app-runtime-config', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('app_runtime_config')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();
      return data ?? null;
    },
    enabled: !!orgId,
    staleTime: 3 * 60 * 1000,
  });

  // Fetch commercial_config (legacy fallback for booking/checkout)
  const { data: ccRow, isLoading: ccLoading } = useQuery({
    queryKey: ['commercial-config', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('commercial_config')
        .select('booking_url, starter_checkout_url, pro_checkout_url, enterprise_checkout_url, support_email, sales_enabled')
        .eq('organization_id', orgId)
        .maybeSingle();
      return data ?? null;
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = rtLoading || ccLoading;

  // ── Priority 1: app_runtime_config ────────────────────────────────────────
  if (rtRow) {
    return {
      coreApiUrl:            cleanUrl(rtRow.core_api_url)             ?? ENV.coreApiUrl,
      aiGatewayUrl:          cleanUrl(rtRow.ai_gateway_url)           ?? ENV.aiGatewayUrl,
      reportsMode:           (rtRow.reports_mode as ReportsMode)      ?? 'internal_fallback',
      salesMode:             (rtRow.sales_mode   as SalesMode)        ?? 'lead_first',
      bookingUrl:            cleanUrl(rtRow.booking_url)              ?? cleanUrl(ccRow?.booking_url) ?? ENV.bookingUrl,
      starterCheckoutUrl:    cleanUrl(rtRow.starter_checkout_url)     ?? cleanUrl(ccRow?.starter_checkout_url) ?? ENV.starterCheckoutUrl,
      proCheckoutUrl:        cleanUrl(rtRow.pro_checkout_url)         ?? cleanUrl(ccRow?.pro_checkout_url) ?? ENV.proCheckoutUrl,
      enterpriseCheckoutUrl: cleanUrl(rtRow.enterprise_checkout_url)  ?? cleanUrl(ccRow?.enterprise_checkout_url) ?? ENV.enterpriseCheckoutUrl,
      supportEmail:          rtRow.support_email                      ?? ccRow?.support_email ?? null,
      salesEnabled:          ccRow?.sales_enabled                     ?? true,
      configSource:          'app_runtime_config',
      isLoading,
    };
  }

  // ── Priority 2: commercial_config ─────────────────────────────────────────
  if (ccRow) {
    return {
      coreApiUrl:            ENV.coreApiUrl,
      aiGatewayUrl:          ENV.aiGatewayUrl,
      reportsMode:           'internal_fallback',
      salesMode:             'lead_first',
      bookingUrl:            cleanUrl(ccRow.booking_url)              ?? ENV.bookingUrl,
      starterCheckoutUrl:    cleanUrl(ccRow.starter_checkout_url)     ?? ENV.starterCheckoutUrl,
      proCheckoutUrl:        cleanUrl(ccRow.pro_checkout_url)         ?? ENV.proCheckoutUrl,
      enterpriseCheckoutUrl: cleanUrl(ccRow.enterprise_checkout_url)  ?? ENV.enterpriseCheckoutUrl,
      supportEmail:          ccRow.support_email ?? null,
      salesEnabled:          ccRow.sales_enabled ?? true,
      configSource:          'commercial_config',
      isLoading,
    };
  }

  // ── Priority 3: env vars / defaults ───────────────────────────────────────
  const hasEnv = Object.values(ENV).some(Boolean);
  return {
    coreApiUrl:            ENV.coreApiUrl,
    aiGatewayUrl:          ENV.aiGatewayUrl,
    reportsMode:           'internal_fallback',
    salesMode:             'lead_first',
    bookingUrl:            ENV.bookingUrl,
    starterCheckoutUrl:    ENV.starterCheckoutUrl,
    proCheckoutUrl:        ENV.proCheckoutUrl,
    enterpriseCheckoutUrl: ENV.enterpriseCheckoutUrl,
    supportEmail:          null,
    salesEnabled:          true,
    configSource:          hasEnv ? 'env' : 'defaults',
    isLoading,
  };
}
