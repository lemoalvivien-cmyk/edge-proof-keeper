
-- ── 1. Enrich sales_leads with UTM + scoring + dedup ──────────────────────
ALTER TABLE public.sales_leads
  ADD COLUMN IF NOT EXISTS lead_score       integer     NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS utm_source       text        NULL,
  ADD COLUMN IF NOT EXISTS utm_medium       text        NULL,
  ADD COLUMN IF NOT EXISTS utm_campaign     text        NULL,
  ADD COLUMN IF NOT EXISTS utm_content      text        NULL,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz NOT NULL DEFAULT now();

-- Indexes for lead management
CREATE INDEX IF NOT EXISTS idx_sales_leads_status        ON public.sales_leads(status);
CREATE INDEX IF NOT EXISTS idx_sales_leads_created_at    ON public.sales_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sales_leads_email         ON public.sales_leads(email);
CREATE INDEX IF NOT EXISTS idx_sales_leads_cta_origin    ON public.sales_leads(cta_origin);
CREATE INDEX IF NOT EXISTS idx_sales_leads_lead_score    ON public.sales_leads(lead_score DESC);

-- ── 2. conversion_events table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.conversion_events (
  id          uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  timestamptz NOT NULL DEFAULT now(),
  event_name  text        NOT NULL,
  source_page text        NULL,
  cta_origin  text        NULL,
  metadata    jsonb       NOT NULL DEFAULT '{}'::jsonb
);

ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can track conversion events"
  ON public.conversion_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view conversion events"
  ON public.conversion_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
        AND ur.role = 'admin'::app_role
    )
  );

CREATE INDEX IF NOT EXISTS idx_conversion_events_event_name  ON public.conversion_events(event_name);
CREATE INDEX IF NOT EXISTS idx_conversion_events_created_at  ON public.conversion_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversion_events_cta_origin  ON public.conversion_events(cta_origin);
