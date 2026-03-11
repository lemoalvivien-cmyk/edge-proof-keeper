/**
 * Minimal conversion tracking utility.
 * Inserts events into conversion_events table (anonymous, public INSERT allowed).
 * Fails silently — never blocks user actions.
 */
import { supabase } from '@/integrations/supabase/client';

export type TrackEventName =
  | 'cta_voir_demo'
  | 'cta_tester_fichier'
  | 'cta_demander_demo'
  | 'demo_dialog_open'
  | 'demo_dialog_submit'
  | 'cta_pricing'
  | 'cta_demarrer';

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
