
-- ============================================================
-- commercial_config : config commerciale pilotable par l'admin
-- ============================================================
CREATE TABLE IF NOT EXISTS public.commercial_config (
  id                      uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id         uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  booking_url             text        NULL,
  starter_checkout_url    text        NULL,
  pro_checkout_url        text        NULL,
  enterprise_checkout_url text        NULL,
  support_email           text        NULL,
  sales_enabled           boolean     NOT NULL DEFAULT true,
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id)
);

CREATE INDEX IF NOT EXISTS idx_commercial_config_org ON public.commercial_config (organization_id);

ALTER TABLE public.commercial_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can select commercial config"
  ON public.commercial_config FOR SELECT
  USING (has_role(auth.uid(), organization_id, 'admin'::app_role));

CREATE POLICY "Admins can insert commercial config"
  ON public.commercial_config FOR INSERT
  WITH CHECK (has_role(auth.uid(), organization_id, 'admin'::app_role));

CREATE POLICY "Admins can update commercial config"
  ON public.commercial_config FOR UPDATE
  USING (has_role(auth.uid(), organization_id, 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), organization_id, 'admin'::app_role));

CREATE TRIGGER trg_commercial_config_updated_at
  BEFORE UPDATE ON public.commercial_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- sales_leads : champs SLA + owner/priority/next_action
-- ============================================================
ALTER TABLE public.sales_leads
  ADD COLUMN IF NOT EXISTS owner           text        NULL,
  ADD COLUMN IF NOT EXISTS priority        text        NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS next_action_at  timestamptz NULL,
  ADD COLUMN IF NOT EXISTS last_contact_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS idx_sales_leads_next_action ON public.sales_leads (next_action_at);
CREATE INDEX IF NOT EXISTS idx_sales_leads_owner       ON public.sales_leads (owner);
