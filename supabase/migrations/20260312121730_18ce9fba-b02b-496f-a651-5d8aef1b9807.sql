-- ── alerts table ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.alerts (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  alert_type          text        NOT NULL,
  severity            text        NOT NULL DEFAULT 'medium',
  title               text        NOT NULL,
  description         text        NOT NULL DEFAULT '',
  source_entity_type  text        NULL,
  source_entity_id    uuid        NULL,
  status              text        NOT NULL DEFAULT 'open',
  first_detected_at   timestamptz NOT NULL DEFAULT now(),
  last_detected_at    timestamptz NOT NULL DEFAULT now(),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_alerts_org_id      ON public.alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status       ON public.alerts(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity     ON public.alerts(organization_id, severity);
CREATE INDEX IF NOT EXISTS idx_alerts_type         ON public.alerts(organization_id, alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_detected_at  ON public.alerts(organization_id, last_detected_at DESC);

CREATE POLICY "Org members can view alerts"
  ON public.alerts FOR SELECT
  USING (public.has_org_access(auth.uid(), organization_id));

CREATE POLICY "Org members can create alerts"
  ON public.alerts FOR INSERT
  WITH CHECK (public.has_org_access(auth.uid(), organization_id));

CREATE POLICY "Org members can update alerts"
  ON public.alerts FOR UPDATE
  USING (public.has_org_access(auth.uid(), organization_id));

CREATE POLICY "Admins can delete alerts"
  ON public.alerts FOR DELETE
  USING (public.has_role(auth.uid(), organization_id, 'admin'::public.app_role));

CREATE TRIGGER update_alerts_updated_at
  BEFORE UPDATE ON public.alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── notification_rules table ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_rules (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  rule_type           text        NOT NULL,
  is_enabled          boolean     NOT NULL DEFAULT true,
  severity_threshold  text        NULL,
  channel             text        NOT NULL DEFAULT 'in_app',
  config              jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_notification_rules_org_id  ON public.notification_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_notification_rules_enabled ON public.notification_rules(organization_id, is_enabled);

CREATE POLICY "Admins can manage notification rules"
  ON public.notification_rules FOR ALL
  USING (public.has_role(auth.uid(), organization_id, 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), organization_id, 'admin'::public.app_role));

CREATE POLICY "Org members can view notification rules"
  ON public.notification_rules FOR SELECT
  USING (public.has_org_access(auth.uid(), organization_id));

CREATE TRIGGER update_notification_rules_updated_at
  BEFORE UPDATE ON public.notification_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── platform_health_snapshots table ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.platform_health_snapshots (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     uuid        NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  health_score        numeric     NOT NULL DEFAULT 0,
  summary             jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_health_snapshots ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_health_snapshots_org_id    ON public.platform_health_snapshots(organization_id);
CREATE INDEX IF NOT EXISTS idx_health_snapshots_created   ON public.platform_health_snapshots(organization_id, created_at DESC);

CREATE POLICY "Org members can view health snapshots"
  ON public.platform_health_snapshots FOR SELECT
  USING (public.has_org_access(auth.uid(), organization_id));

CREATE POLICY "Org members can create health snapshots"
  ON public.platform_health_snapshots FOR INSERT
  WITH CHECK (public.has_org_access(auth.uid(), organization_id));