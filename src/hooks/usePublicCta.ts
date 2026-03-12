/**
 * usePublicCta
 *
 * Single source of truth for all public CTA behaviours (booking, checkout, lead fallback).
 *
 * Config resolution chain (explicit, testable):
 *   1. usePublicTenantConfig → edge function → DB (app_runtime_config or commercial_config)
 *      Works for unauthenticated visitors. tenant_resolved tells us if a real org was found.
 *   2. Env vars (VITE_BOOKING_URL, etc.) — secondary fallback inside usePublicTenantConfig
 *   3. Lead capture fallback (onFallback) — always available
 *
 * configSource values (visible, testable):
 *   "db:app_runtime_config" — config came from DB primary table
 *   "db:commercial_config"  — config came from DB legacy table
 *   "env"                   — env vars used (DB had no config or was unreachable)
 *   "none"                  — nothing configured anywhere
 *
 * ctaMode (per-action, testable):
 *   "checkout"     — direct payment link used
 *   "booking"      — booking/calendar link used
 *   "lead_capture" — fallback form opened
 *
 * Usage:
 *   const cta = usePublicCta();
 *   cta.handleBooking({ sourcePage: '/', ctaOrigin: 'hero_primary', onFallback: () => setDialogOpen(true) });
 *   cta.handleCheckout('starter', { sourcePage: '/pricing', ctaOrigin: 'pricing_starter', onFallback: ... });
 */
import { usePublicTenantConfig } from './usePublicTenantConfig';
import { useBootstrapState } from './useBootstrapState';
import { trackEvent, type TrackEventName, type TrackEventOptions } from '@/lib/tracking';

export interface CtaCallOptions {
  sourcePage?: string;
  ctaOrigin?: string;
  onFallback: () => void;
}

export type PlanKey = 'starter' | 'pro' | 'enterprise';
export type CtaMode = 'checkout' | 'booking' | 'lead_capture';

export interface PublicCtaState {
  /** Whether config is still loading */
  isLoading: boolean;
  /** Explicit source of config — testable */
  configSource: string;
  /** true if a real org was found in DB (tenant resolution succeeded) */
  tenantResolved: boolean;
  /** Org slug if resolved */
  tenantSlug: string | null;
  /** Resolved booking URL or null */
  bookingUrl: string | null;
  /** Resolved checkout URLs by plan */
  checkoutUrls: Record<PlanKey, string | null>;
  /** Current bootstrap phase — for visibility */
  bootstrapPhase: string;
  /** Effective CTA mode for demo/hero (computed, testable) */
  demoCta: CtaMode;
  /** Open booking URL or call fallback, with tracking */
  handleBooking: (opts: CtaCallOptions) => void;
  /** Open checkout URL or cascade to booking or fallback, with tracking */
  handleCheckout: (plan: PlanKey, opts: CtaCallOptions) => void;
  /** Open booking if available, otherwise open lead-capture fallback */
  handleDemoRequest: (opts: CtaCallOptions) => void;
}

export function usePublicCta(): PublicCtaState {
  const cfg = usePublicTenantConfig();
  const bs  = useBootstrapState();

  const bookingUrl = cfg.bookingUrl;
  const checkoutUrls: Record<PlanKey, string | null> = {
    starter:    cfg.starterCheckoutUrl   ?? null,
    pro:        cfg.proCheckoutUrl       ?? null,
    enterprise: cfg.enterpriseCheckoutUrl ?? null,
  };

  // Compute effective demo CTA mode — visible and testable
  const demoCta: CtaMode = bookingUrl ? 'booking' : 'lead_capture';

  /** Shared tracking metadata — captures full config provenance */
  function trackMeta(extra: Record<string, unknown> = {}): Record<string, unknown> {
    return {
      config_source:    cfg.configSource,
      tenant_resolved:  cfg.tenantResolved,
      bootstrap_phase:  bs.phase,
      has_commercial_urls: bs.hasCommercialUrls,
      ...extra,
    };
  }

  function handleBooking(opts: CtaCallOptions) {
    const base: TrackEventOptions = {
      source_page: opts.sourcePage,
      cta_origin:  opts.ctaOrigin,
    };
    if (bookingUrl) {
      trackEvent('booking_click_direct', {
        ...base,
        metadata: trackMeta({ cta_mode: 'booking' }),
      });
      window.open(bookingUrl, '_blank', 'noopener,noreferrer');
    } else {
      trackEvent('demo_dialog_open', {
        ...base,
        metadata: trackMeta({ cta_mode: 'lead_capture', fallback_reason: 'no_booking_url' }),
      });
      opts.onFallback();
    }
  }

  function handleCheckout(plan: PlanKey, opts: CtaCallOptions) {
    const checkoutUrl = checkoutUrls[plan];
    const base: TrackEventOptions = {
      source_page: opts.sourcePage,
      cta_origin:  opts.ctaOrigin,
    };
    if (checkoutUrl) {
      trackEvent('checkout_click', {
        ...base,
        metadata: trackMeta({ cta_mode: 'checkout', plan }),
      });
      window.open(checkoutUrl, '_blank', 'noopener,noreferrer');
    } else if (bookingUrl) {
      // Cascade: no checkout → offer booking instead
      trackEvent('booking_click_direct', {
        ...base,
        metadata: trackMeta({ cta_mode: 'booking', cascade_from: 'checkout', plan }),
      });
      window.open(bookingUrl, '_blank', 'noopener,noreferrer');
    } else {
      // Last resort: lead capture
      trackEvent('demo_dialog_open', {
        ...base,
        metadata: trackMeta({ cta_mode: 'lead_capture', cascade_from: 'checkout', plan, fallback_reason: 'no_checkout_no_booking' }),
      });
      opts.onFallback();
    }
  }

  function handleDemoRequest(opts: CtaCallOptions) {
    const base: TrackEventOptions = {
      source_page: opts.sourcePage,
      cta_origin:  opts.ctaOrigin,
    };
    if (bookingUrl) {
      trackEvent('booking_click_direct', {
        ...base,
        metadata: trackMeta({ cta_mode: 'booking' }),
      });
      window.open(bookingUrl, '_blank', 'noopener,noreferrer');
    } else {
      trackEvent('demo_dialog_open', {
        ...base,
        metadata: trackMeta({ cta_mode: 'lead_capture', fallback_reason: 'no_booking_url' }),
      });
      opts.onFallback();
    }
  }

  return {
    isLoading:        cfg.isLoading || bs.phase === 'loading',
    configSource:     cfg.configSource,
    tenantResolved:   cfg.tenantResolved,
    tenantSlug:       cfg.tenantSlug,
    bookingUrl,
    checkoutUrls,
    bootstrapPhase:   bs.phase,
    demoCta,
    handleBooking,
    handleCheckout,
    handleDemoRequest,
  };
}
