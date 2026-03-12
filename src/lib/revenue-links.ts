/**
 * revenue-links.ts
 * Single source of truth for all commercial URLs (booking, checkout).
 * Values come from Vite env variables — never hardcoded.
 * DB-level overrides are handled by useCommercialConfig (takes priority at runtime).
 *
 * Usage:
 *   import { getBookingUrl, getCheckoutUrl, openBookingOrFallback } from '@/lib/revenue-links';
 */

export interface RevenueLinks {
  bookingUrl: string | null;
  starterCheckoutUrl: string | null;
  proCheckoutUrl: string | null;
  enterpriseCheckoutUrl: string | null;
}

/** Read all commercial URLs from env */
export function getRevenueLinks(): RevenueLinks {
  return {
    bookingUrl:             import.meta.env.VITE_BOOKING_URL             || null,
    starterCheckoutUrl:     import.meta.env.VITE_STARTER_CHECKOUT_URL    || null,
    proCheckoutUrl:         import.meta.env.VITE_PRO_CHECKOUT_URL        || null,
    enterpriseCheckoutUrl:  import.meta.env.VITE_ENTERPRISE_CHECKOUT_URL || null,
  };
}

/** Convenience: booking URL only */
export function getBookingUrl(): string | null {
  return import.meta.env.VITE_BOOKING_URL || null;
}

/** Whether booking URL is configured */
export function hasBookingUrl(): boolean {
  return Boolean(import.meta.env.VITE_BOOKING_URL);
}

/** Convenience: checkout by plan */
export type PlanKey = 'starter' | 'pro' | 'enterprise';
export function getCheckoutUrl(plan: PlanKey = 'starter'): string | null {
  const map: Record<PlanKey, string> = {
    starter:    import.meta.env.VITE_STARTER_CHECKOUT_URL    || '',
    pro:        import.meta.env.VITE_PRO_CHECKOUT_URL         || '',
    enterprise: import.meta.env.VITE_ENTERPRISE_CHECKOUT_URL  || '',
  };
  return map[plan] || null;
}

/** Whether a specific plan's checkout URL is configured */
export function hasCheckoutUrl(plan: PlanKey): boolean {
  return Boolean(getCheckoutUrl(plan));
}

/** Whether any checkout URL is configured */
export function hasAnyCheckout(): boolean {
  return !!(
    import.meta.env.VITE_STARTER_CHECKOUT_URL ||
    import.meta.env.VITE_PRO_CHECKOUT_URL ||
    import.meta.env.VITE_ENTERPRISE_CHECKOUT_URL
  );
}

/**
 * Open booking URL in new tab, or call fallback (e.g. open dialog).
 * Returns true if booking URL was used, false if fallback was called.
 */
export function openBookingOrFallback(fallback: () => void): boolean {
  const url = getBookingUrl();
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }
  fallback();
  return false;
}

/**
 * Open a checkout URL or call fallback.
 * Returns true if checkout URL was used.
 */
export function openCheckoutOrFallback(plan: PlanKey, fallback: () => void): boolean {
  const url = getCheckoutUrl(plan);
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }
  fallback();
  return false;
}
