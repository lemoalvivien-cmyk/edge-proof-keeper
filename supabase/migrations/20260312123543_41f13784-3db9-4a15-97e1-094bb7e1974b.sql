-- ── portfolio_summaries ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.portfolio_summaries (
  id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid        NOT NULL,
  summary_type    text        NOT NULL,
  model_name      text        NULL,
  source_snapshot jsonb       NOT NULL DEFAULT '{}'::jsonb,
  output_json     jsonb       NOT NULL DEFAULT '{}'::jsonb,
  period_label    text        NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_portfolio_summaries_org
    FOREIGN KEY (organization_id)
    REFERENCES public.organizations(id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_portfolio_summaries_org_type_created
  ON public.portfolio_summaries (organization_id, summary_type, created_at DESC);

ALTER TABLE public.portfolio_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view portfolio summaries"
  ON public.portfolio_summaries FOR SELECT
  USING (has_org_access(auth.uid(), organization_id));

CREATE POLICY "Org members can create portfolio summaries"
  ON public.portfolio_summaries FOR INSERT
  WITH CHECK (has_org_access(auth.uid(), organization_id));

CREATE POLICY "Admins can delete portfolio summaries"
  ON public.portfolio_summaries FOR DELETE
  USING (has_role(auth.uid(), organization_id, 'admin'::app_role));