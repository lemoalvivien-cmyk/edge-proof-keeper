/**
 * useCommercialConfig
 * Reads commercial URLs from:
 *   1. DB table `commercial_config` (admin-editable, takes priority)
 *   2. Vite env vars (fallback)
 *
 * Returns a stable object with the effective values + helpers.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getRevenueLinks } from '@/lib/revenue-links';

export interface EffectiveConfig {
  bookingUrl: string | null;
  starterCheckoutUrl: string | null;
  proCheckoutUrl: string | null;
  enterpriseCheckoutUrl: string | null;
  supportEmail: string | null;
  salesEnabled: boolean;
  /** true = loaded from DB, false = env fallback */
  fromDb: boolean;
}

export function useCommercialConfig(): { config: EffectiveConfig; isLoading: boolean } {
  const { organization } = useAuth();
  const envLinks = getRevenueLinks();

  const { data: dbRow, isLoading } = useQuery({
    queryKey: ['commercial-config', organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('commercial_config')
        .select('booking_url, starter_checkout_url, pro_checkout_url, enterprise_checkout_url, support_email, sales_enabled')
        .eq('organization_id', organization.id)
        .maybeSingle();
      return data ?? null;
    },
    enabled: !!organization?.id,
    staleTime: 5 * 60 * 1000, // 5 min
  });

  if (dbRow) {
    return {
      config: {
        bookingUrl:             dbRow.booking_url             || envLinks.bookingUrl,
        starterCheckoutUrl:     dbRow.starter_checkout_url   || envLinks.starterCheckoutUrl,
        proCheckoutUrl:         dbRow.pro_checkout_url        || envLinks.proCheckoutUrl,
        enterpriseCheckoutUrl:  dbRow.enterprise_checkout_url || envLinks.enterpriseCheckoutUrl,
        supportEmail:           dbRow.support_email           || null,
        salesEnabled:           dbRow.sales_enabled           ?? true,
        fromDb:                 true,
      },
      isLoading,
    };
  }

  return {
    config: {
      bookingUrl:             envLinks.bookingUrl,
      starterCheckoutUrl:     envLinks.starterCheckoutUrl,
      proCheckoutUrl:         envLinks.proCheckoutUrl,
      enterpriseCheckoutUrl:  envLinks.enterpriseCheckoutUrl,
      supportEmail:           null,
      salesEnabled:           true,
      fromDb:                 false,
    },
    isLoading,
  };
}
