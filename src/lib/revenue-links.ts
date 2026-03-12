/**
 * revenue-links.ts
 * Single source of truth for all commercial URLs (booking, checkout).
 *
 * Runtime priority (from useRuntimeConfig):
 *   1. app_runtime_config DB row
 *   2. commercial_config  DB row (legacy)
 *   3. Vite env variables
 *   4. safe null / fallback
 *
 * These helpers operate on env vars only (synchronous, no React context).
 * For the full DB-aware config, use useRuntimeConfig() hook in components.
 *
 * Usage:
 *   import { getBookingUrl, getCheckoutUrl, openBookingOrFallback } from '@/lib/revenue-links';
 */

export interface RevenueLinks {
  bookingUrl:             string | null;
  starterCheckoutUrl:     string | null;
  proCheckoutUrl:         string | null;
  enterpriseCheckoutUrl:  string | null;
}

/** Read all commercial URLs from env (synchronous fallback, no DB). */
export function getRevenueLinks(): RevenueLinks {
  return {
    bookingUrl:             import.meta.env.VITE_BOOKING_URL             || null,
    starterCheckoutUrl:     import.meta.env.VITE_STARTER_CHECKOUT_URL    || null,
    proCheckoutUrl:         import.meta.env.VITE_PRO_CHECKOUT_URL        || null,
    enterpriseCheckoutUrl:  import.meta.env.VITE_ENTERPRISE_CHECKOUT_URL || null,
  };
}

/** Convenience: booking URL from env only */
export function getBookingUrl(): string | null {
  return import.meta.env.VITE_BOOKING_URL || null;
}

/** Whether booking URL is configured (env) */
export function hasBookingUrl(): boolean {
  return Boolean(import.meta.env.VITE_BOOKING_URL);
}

/** Convenience: checkout by plan (env only) */
export type PlanKey = 'starter' | 'pro' | 'enterprise';
export function getCheckoutUrl(plan: PlanKey = 'starter'): string | null {
  const map: Record<PlanKey, string> = {
    starter:    import.meta.env.VITE_STARTER_CHECKOUT_URL    || '',
    pro:        import.meta.env.VITE_PRO_CHECKOUT_URL         || '',
    enterprise: import.meta.env.VITE_ENTERPRISE_CHECKOUT_URL  || '',
  };
  return map[plan] || null;
}

/** Whether a specific plan's checkout URL is configured (env) */
export function hasCheckoutUrl(plan: PlanKey): boolean {
  return Boolean(getCheckoutUrl(plan));
}

/** Whether any checkout URL is configured (env) */
export function hasAnyCheckout(): boolean {
  return !!(
    import.meta.env.VITE_STARTER_CHECKOUT_URL ||
    import.meta.env.VITE_PRO_CHECKOUT_URL ||
    import.meta.env.VITE_ENTERPRISE_CHECKOUT_URL
  );
}

/**
 * Open booking URL (env) in new tab, or call fallback.
 * Returns true if booking URL was used, false if fallback was called.
 * NOTE: For DB-aware booking, pass the url from useRuntimeConfig() directly.
 */
export function openBookingOrFallback(fallback: () => void, overrideUrl?: string | null): boolean {
  const url = overrideUrl ?? getBookingUrl();
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }
  fallback();
  return false;
}

/**
 * Open a checkout URL (env) or call fallback.
 * Returns true if checkout URL was used.
 * NOTE: For DB-aware checkout, pass the url from useRuntimeConfig() directly.
 */
export function openCheckoutOrFallback(plan: PlanKey, fallback: () => void, overrideUrl?: string | null): boolean {
  const url = overrideUrl ?? getCheckoutUrl(plan);
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return true;
  }
  fallback();
  return false;
}
