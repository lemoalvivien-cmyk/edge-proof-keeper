
-- ═══════════════════════════════════════════════════════════════
-- CYBER SERENITY — Core Engine Migration
-- ═══════════════════════════════════════════════════════════════

-- ─── A. data_sources ─────────────────────────────────────────
CREATE TABLE public.data_sources (
  id                uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id   uuid          NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name              text          NOT NULL,
  source_type       text          NOT NULL,
  category          text          NOT NULL,
  status            text          NOT NULL DEFAULT 'not_configured',
  config            jsonb         NOT NULL DEFAULT '{}'::jsonb,
  last_sync_at      timestamptz   NULL,
  confidence_score  numeric       NULL CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX idx_data_sources_org ON public.data_sources (organization_id);
CREATE INDEX idx_data_sources_status ON public.data_sources (organization_id, status);
ALTER TABLE public.data_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view data sources" ON public.data_sources FOR SELECT USING (has_org_access(auth.uid(), organization_id));
CREATE POLICY "Org members can create data sources" ON public.data_sources FOR INSERT WITH CHECK (has_org_access(auth.uid(), organization_id));
CREATE POLICY "Org members can update data sources" ON public.data_sources FOR UPDATE USING (has_org_access(auth.uid(), organization_id));
CREATE POLICY "Admins can delete data sources" ON public.data_sources FOR DELETE USING (has_role(auth.uid(), organization_id, 'admin'::app_role));
CREATE TRIGGER update_data_sources_updated_at BEFORE UPDATE ON public.data_sources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── B. source_sync_runs ─────────────────────────────────────
CREATE TABLE public.source_sync_runs (
  id                uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id   uuid          NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source_id         uuid          NOT NULL REFERENCES public.data_sources(id) ON DELETE CASCADE,
  status            text          NOT NULL DEFAULT 'pending',
  started_at        timestamptz   NOT NULL DEFAULT now(),
  completed_at      timestamptz   NULL,
  items_received    integer       NOT NULL DEFAULT 0,
  items_normalized  integer       NOT NULL DEFAULT 0,
  error_message     text          NULL,
  raw_summary       jsonb         NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX idx_source_sync_runs_org ON public.source_sync_runs (organization_id);
CREATE INDEX idx_source_sync_runs_source ON public.source_sync_runs (source_id);
CREATE INDEX idx_source_sync_runs_status ON public.source_sync_runs (organization_id, status);
ALTER TABLE public.source_sync_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view sync runs" ON public.source_sync_runs FOR SELECT USING (has_org_access(auth.uid(), organization_id));
CREATE POLICY "Org members can create sync runs" ON public.source_sync_runs FOR INSERT WITH CHECK (has_org_access(auth.uid(), organization_id));
CREATE POLICY "Org members can update sync runs" ON public.source_sync_runs FOR UPDATE USING (has_org_access(auth.uid(), organization_id));

-- ─── C. signals ──────────────────────────────────────────────
-- Note: 'references' is a reserved SQL keyword, using 'signal_refs' instead
CREATE TABLE public.signals (
  id                uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id   uuid          NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  source_id         uuid          NOT NULL REFERENCES public.data_sources(id) ON DELETE CASCADE,
  asset_id          uuid          NULL REFERENCES public.assets(id) ON DELETE SET NULL,
  signal_type       text          NOT NULL,
  category          text          NOT NULL,
  title             text          NOT NULL,
  description       text          NOT NULL DEFAULT '',
  severity          text          NOT NULL DEFAULT 'info',
  confidence_score  numeric       NULL CHECK (confidence_score IS NULL OR (confidence_score >= 0 AND confidence_score <= 1)),
  evidence          jsonb         NOT NULL DEFAULT '{}'::jsonb,
  signal_refs       jsonb         NOT NULL DEFAULT '[]'::jsonb,
  detected_at       timestamptz   NOT NULL DEFAULT now(),
  status            text          NOT NULL DEFAULT 'new',
  dedupe_key        text          NULL,
  raw_payload       jsonb         NOT NULL DEFAULT '{}'::jsonb,
  created_at        timestamptz   NOT NULL DEFAULT now(),
  updated_at        timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX idx_signals_org ON public.signals (organization_id);
CREATE INDEX idx_signals_source ON public.signals (source_id);
CREATE INDEX idx_signals_status ON public.signals (organization_id, status);
CREATE INDEX idx_signals_severity ON public.signals (organization_id, severity);
CREATE INDEX idx_signals_dedupe ON public.signals (organization_id, dedupe_key) WHERE dedupe_key IS NOT NULL;
CREATE INDEX idx_signals_asset ON public.signals (asset_id) WHERE asset_id IS NOT NULL;
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view signals" ON public.signals FOR SELECT USING (has_org_access(auth.uid(), organization_id));
CREATE POLICY "Org members can create signals" ON public.signals FOR INSERT WITH CHECK (has_org_access(auth.uid(), organization_id));
CREATE POLICY "Org members can update signals" ON public.signals FOR UPDATE USING (has_org_access(auth.uid(), organization_id));
CREATE TRIGGER update_signals_updated_at BEFORE UPDATE ON public.signals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── D. risk_register ────────────────────────────────────────
CREATE TABLE public.risk_register (
  id                   uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id      uuid          NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_id             uuid          NULL REFERENCES public.assets(id) ON DELETE SET NULL,
  title                text          NOT NULL,
  description          text          NOT NULL DEFAULT '',
  risk_level           text          NOT NULL DEFAULT 'low',
  score                numeric       NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  business_impact      text          NOT NULL DEFAULT '',
  technical_impact     text          NOT NULL DEFAULT '',
  status               text          NOT NULL DEFAULT 'open',
  owner                text          NULL,
  due_date             date          NULL,
  source_signal_ids    jsonb         NOT NULL DEFAULT '[]'::jsonb,
  created_at           timestamptz   NOT NULL DEFAULT now(),
  updated_at           timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX idx_risk_register_org ON public.risk_register (organization_id);
CREATE INDEX idx_risk_register_status ON public.risk_register (organization_id, status);
CREATE INDEX idx_risk_register_level ON public.risk_register (organization_id, risk_level);
CREATE INDEX idx_risk_register_asset ON public.risk_register (asset_id) WHERE asset_id IS NOT NULL;
ALTER TABLE public.risk_register ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view risks" ON public.risk_register FOR SELECT USING (has_org_access(auth.uid(), organization_id));
CREATE POLICY "Org members can create risks" ON public.risk_register FOR INSERT WITH CHECK (has_org_access(auth.uid(), organization_id));
CREATE POLICY "Org members can update risks" ON public.risk_register FOR UPDATE USING (has_org_access(auth.uid(), organization_id));
CREATE POLICY "Admins can delete risks" ON public.risk_register FOR DELETE USING (has_role(auth.uid(), organization_id, 'admin'::app_role));
CREATE TRIGGER update_risk_register_updated_at BEFORE UPDATE ON public.risk_register FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── E. remediation_actions ──────────────────────────────────
CREATE TABLE public.remediation_actions (
  id                    uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id       uuid          NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  risk_id               uuid          NOT NULL REFERENCES public.risk_register(id) ON DELETE CASCADE,
  title                 text          NOT NULL,
  action_type           text          NOT NULL,
  priority              text          NOT NULL DEFAULT 'medium',
  status                text          NOT NULL DEFAULT 'open',
  owner                 text          NULL,
  due_date              date          NULL,
  expected_gain         text          NOT NULL DEFAULT '',
  implementation_notes  text          NOT NULL DEFAULT '',
  created_at            timestamptz   NOT NULL DEFAULT now(),
  updated_at            timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX idx_remediation_actions_org ON public.remediation_actions (organization_id);
CREATE INDEX idx_remediation_actions_risk ON public.remediation_actions (risk_id);
CREATE INDEX idx_remediation_actions_status ON public.remediation_actions (organization_id, status);
ALTER TABLE public.remediation_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view remediation actions" ON public.remediation_actions FOR SELECT USING (has_org_access(auth.uid(), organization_id));
CREATE POLICY "Org members can create remediation actions" ON public.remediation_actions FOR INSERT WITH CHECK (has_org_access(auth.uid(), organization_id));
CREATE POLICY "Org members can update remediation actions" ON public.remediation_actions FOR UPDATE USING (has_org_access(auth.uid(), organization_id));
CREATE POLICY "Admins can delete remediation actions" ON public.remediation_actions FOR DELETE USING (has_role(auth.uid(), organization_id, 'admin'::app_role));
CREATE TRIGGER update_remediation_actions_updated_at BEFORE UPDATE ON public.remediation_actions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── F. ai_analyses ──────────────────────────────────────────
CREATE TABLE public.ai_analyses (
  id               uuid          NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id  uuid          NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type      text          NOT NULL,
  entity_id        uuid          NOT NULL,
  model_name       text          NOT NULL,
  analysis_type    text          NOT NULL,
  prompt_version   text          NOT NULL,
  input_fact_pack  jsonb         NOT NULL DEFAULT '{}'::jsonb,
  output_json      jsonb         NOT NULL DEFAULT '{}'::jsonb,
  created_at       timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_analyses_org ON public.ai_analyses (organization_id);
CREATE INDEX idx_ai_analyses_entity ON public.ai_analyses (entity_type, entity_id);
CREATE INDEX idx_ai_analyses_type ON public.ai_analyses (organization_id, analysis_type);
ALTER TABLE public.ai_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members can view AI analyses" ON public.ai_analyses FOR SELECT USING (has_org_access(auth.uid(), organization_id));
CREATE POLICY "Org members can create AI analyses" ON public.ai_analyses FOR INSERT WITH CHECK (has_org_access(auth.uid(), organization_id));

-- ═══════════════════════════════════════════════════════════════
-- SQL UTILITY FUNCTIONS
-- ═══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.normalize_severity(input_severity text)
RETURNS text LANGUAGE sql IMMUTABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT CASE lower(trim(input_severity))
    WHEN 'critical'      THEN 'critical'
    WHEN 'crit'          THEN 'critical'
    WHEN 'high'          THEN 'high'
    WHEN 'medium'        THEN 'medium'
    WHEN 'med'           THEN 'medium'
    WHEN 'moderate'      THEN 'medium'
    WHEN 'low'           THEN 'low'
    WHEN 'info'          THEN 'info'
    WHEN 'informational' THEN 'info'
    WHEN 'none'          THEN 'info'
    ELSE 'info'
  END
$$;

CREATE OR REPLACE FUNCTION public.calculate_risk_score(
  severity text,
  confidence_score numeric DEFAULT 0.5
)
RETURNS numeric LANGUAGE sql IMMUTABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT ROUND(
    CASE public.normalize_severity(severity)
      WHEN 'critical' THEN 90
      WHEN 'high'     THEN 70
      WHEN 'medium'   THEN 45
      WHEN 'low'      THEN 20
      ELSE 5
    END
    * COALESCE(LEAST(GREATEST(confidence_score, 0), 1), 0.5)
  , 1)
$$;

CREATE OR REPLACE FUNCTION public.get_platform_health(_org_id uuid)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_sources     bigint;
  v_signals     bigint;
  v_risks       bigint;
  v_actions     bigint;
BEGIN
  IF NOT has_org_access(auth.uid(), _org_id) THEN
    RAISE EXCEPTION 'Access denied to organization';
  END IF;
  SELECT count(*) INTO v_sources FROM public.data_sources WHERE organization_id = _org_id AND status = 'active';
  SELECT count(*) INTO v_signals FROM public.signals WHERE organization_id = _org_id AND status IN ('new', 'acknowledged');
  SELECT count(*) INTO v_risks FROM public.risk_register WHERE organization_id = _org_id AND status = 'open';
  SELECT count(*) INTO v_actions FROM public.remediation_actions WHERE organization_id = _org_id AND status IN ('open', 'in_progress');
  RETURN jsonb_build_object(
    'active_sources',   v_sources,
    'open_signals',     v_signals,
    'open_risks',       v_risks,
    'pending_actions',  v_actions,
    'checked_at',       now()
  );
END;
$$;
