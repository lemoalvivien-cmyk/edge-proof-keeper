/**
 * Conversion tracking utility — funnel instrumentation.
 * Inserts events into conversion_events table (anonymous, public INSERT allowed).
 * Fails silently — never blocks user actions.
 *
 * Funnel stages:
 *   TOFU: landing impressions → CTA clicks
 *   MOFU: demo/pricing views → upgrade wall interactions
 *   BOFU: checkout → activation → retention events
 *
 * Event catalog:
 *   landing_cta_click       — any CTA on landing page
 *   pricing_view            — /pricing page loaded
 *   trial_start             — "start trial" CTA clicked
 *   paywall_seen            — upgrade wall displayed
 *   paywall_plan_selected   — plan chosen on upgrade wall
 *   upgrade_click           — upgrade CTA clicked anywhere
 *   executive_view          — /executive cockpit opened
 *   proof_generated         — proof pack exported/generated
 *   access_code_activated   — code redeemed successfully
 *   demo_started            — /demo page entered
 *   demo_completed          — demo cycle reached end state
 *   contact_request         — demo request dialog submitted
 *   intent_enterprise       — Sovereign plan interest or contact enterprise CTA
 */
import { supabase } from '@/integrations/supabase/client';

export type TrackEventName =
  // TOFU — awareness & interest
  | 'cta_voir_demo'
  | 'cta_tester_fichier'
  | 'cta_demander_demo'
  | 'cta_essai_gratuit'
  | 'landing_cta_click'
  | 'pricing_section_viewed'
  | 'pricing_view'
  | 'demo_dialog_open'
  | 'demo_dialog_submit'
  | 'contact_request'
  // MOFU — consideration & intent
  | 'cta_pricing'
  | 'cta_demarrer'
  | 'executive_view'
  | 'proofs_view'
  | 'paywall_plan_view'
  | 'paywall_seen'
  | 'upsell_nudge_click'
  | 'upgrade_wall_seen'
  | 'upgrade_wall_plan_selected'
  | 'upgrade_wall_code_opened'
  | 'upgrade_click'
  | 'intent_enterprise'
  // BOFU — conversion & retention
  | 'cta_stripe_checkout'
  | 'checkout_click'
  | 'booking_click_post_submit'
  | 'demo_click_post_submit'
  | 'booking_click_direct'
  | 'proof_generated'
  | 'access_code_activated'
  | 'trial_start'
  | 'trial_started'
  | 'demo_started'
  | 'demo_completed'
  | 'cta_sandbox_supervisee';

export interface TrackEventOptions {
  source_page?: string;
  cta_origin?: string;
  metadata?: Record<string, unknown>;
}

export async function trackEvent(
  event_name: TrackEventName,
  options: TrackEventOptions = {},
): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('conversion_events').insert({
      event_name,
      source_page: options.source_page ?? (typeof window !== 'undefined' ? window.location.pathname : '/'),
      cta_origin: options.cta_origin ?? null,
      metadata: options.metadata ?? {},
    });
  } catch {
    // Fail silently — tracking must never block the user
  }
}
