/**
 * usePublicCta
 *
 * Single source of truth for all public CTA behaviours (booking, checkout, lead fallback).
 * Built on top of useRuntimeConfig — DB-aware, priority: DB > env.
 *
 * Usage:
 *   const cta = usePublicCta();
 *   cta.handleBooking({ sourcePage: '/', ctaOrigin: 'hero_primary', onFallback: () => setDialogOpen(true) });
 *   cta.handleCheckout('starter', { sourcePage: '/pricing', ctaOrigin: 'pricing_starter', onFallback: ... });
 */
import { useRuntimeConfig } from './useRuntimeConfig';
import { trackEvent, type TrackEventName, type TrackEventOptions } from '@/lib/tracking';

export interface CtaCallOptions {
  sourcePage?: string;
  ctaOrigin?: string;
  onFallback: () => void;
}

export type PlanKey = 'starter' | 'pro' | 'enterprise';

export interface PublicCtaState {
  /** Whether runtime config is still loading */
  isLoading: boolean;
  /** Which table / source provided the config */
  configSource: string;
  /** Resolved booking URL or null */
  bookingUrl: string | null;
  /** Resolved checkout URLs by plan */
  checkoutUrls: Record<PlanKey, string | null>;
  /** Open booking URL or call fallback, with tracking */
  handleBooking: (opts: CtaCallOptions) => void;
  /** Open checkout URL or cascade to booking or fallback, with tracking */
  handleCheckout: (plan: PlanKey, opts: CtaCallOptions) => void;
  /** Open booking if available, otherwise open lead-capture fallback */
  handleDemoRequest: (opts: CtaCallOptions) => void;
}

export function usePublicCta(): PublicCtaState {
  const rt = useRuntimeConfig();

  const bookingUrl = rt.bookingUrl ?? null;
  const checkoutUrls: Record<PlanKey, string | null> = {
    starter:    rt.starterCheckoutUrl   ?? null,
    pro:        rt.proCheckoutUrl       ?? null,
    enterprise: rt.enterpriseCheckoutUrl ?? null,
  };

  function handleBooking(opts: CtaCallOptions) {
    const eventName: TrackEventName = 'booking_click_direct';
    const eventOpts: TrackEventOptions = { source_page: opts.sourcePage, cta_origin: opts.ctaOrigin };
    if (bookingUrl) {
      trackEvent(eventName, eventOpts);
      window.open(bookingUrl, '_blank', 'noopener,noreferrer');
    } else {
      trackEvent('demo_dialog_open', eventOpts);
      opts.onFallback();
    }
  }

  function handleCheckout(plan: PlanKey, opts: CtaCallOptions) {
    const checkoutUrl = checkoutUrls[plan];
    const eventOpts: TrackEventOptions = { source_page: opts.sourcePage, cta_origin: opts.ctaOrigin };
    if (checkoutUrl) {
      trackEvent('checkout_click', { ...eventOpts, metadata: { plan } });
      window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
    } else if (bookingUrl) {
      // Cascade: no checkout → offer booking instead
      trackEvent('booking_click_direct', { ...eventOpts, metadata: { cascade_from: 'checkout', plan } });
      window.open(bookingUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Last resort: lead capture
      trackEvent('demo_dialog_open', { ...eventOpts, metadata: { cascade_from: 'checkout', plan } });
      opts.onFallback();
    }
  }

  function handleDemoRequest(opts: CtaCallOptions) {
    const eventOpts: TrackEventOptions = { source_page: opts.sourcePage, cta_origin: opts.ctaOrigin };
    if (bookingUrl) {
      trackEvent('booking_click_direct', eventOpts);
      window.open(bookingUrl, '_blank', 'noopener,noreferrer');
    } else {
      trackEvent('demo_dialog_open', eventOpts);
      opts.onFallback();
    }
  }

  return {
    isLoading:    rt.isLoading,
    configSource: rt.configSource,
    bookingUrl,
    checkoutUrls,
    handleBooking,
    handleCheckout,
    handleDemoRequest,
  };
}
