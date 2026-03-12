
-- ─── app_runtime_config ──────────────────────────────────────────────────────
-- One row per organization. Stores all runtime-configurable parameters that
-- previously relied on env vars. DB values take priority over env vars.

CREATE TABLE IF NOT EXISTS public.app_runtime_config (
  id                       uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id          uuid        NOT NULL UNIQUE,
  core_api_url             text        NULL,
  ai_gateway_url           text        NULL,
  booking_url              text        NULL,
  starter_checkout_url     text        NULL,
  pro_checkout_url         text        NULL,
  enterprise_checkout_url  text        NULL,
  support_email            text        NULL,
  reports_mode             text        NOT NULL DEFAULT 'internal_fallback',
  sales_mode               text        NOT NULL DEFAULT 'lead_first',
  created_at               timestamptz NOT NULL DEFAULT now(),
  updated_at               timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_runtime_config_org
    FOREIGN KEY (organization_id) REFERENCES public.organizations (id) ON DELETE CASCADE,
  CONSTRAINT chk_reports_mode CHECK (reports_mode IN ('external_only', 'internal_fallback', 'internal_only')),
  CONSTRAINT chk_sales_mode   CHECK (sales_mode   IN ('lead_first', 'checkout_first', 'booking_first', 'disabled'))
);

CREATE INDEX IF NOT EXISTS idx_app_runtime_config_org
  ON public.app_runtime_config (organization_id);

CREATE TRIGGER trg_app_runtime_config_updated_at
  BEFORE UPDATE ON public.app_runtime_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.app_runtime_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select runtime config"
  ON public.app_runtime_config FOR SELECT
  USING (has_role(auth.uid(), organization_id, 'admin'::app_role));

CREATE POLICY "Admins can insert runtime config"
  ON public.app_runtime_config FOR INSERT
  WITH CHECK (has_role(auth.uid(), organization_id, 'admin'::app_role));

CREATE POLICY "Admins can update runtime config"
  ON public.app_runtime_config FOR UPDATE
  USING  (has_role(auth.uid(), organization_id, 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), organization_id, 'admin'::app_role));
