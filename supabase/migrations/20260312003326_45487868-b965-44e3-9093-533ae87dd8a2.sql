
-- ============================================================
-- CYBER SERENITY — Engine Core: Triggers, Indexes, FK, RLS
-- Production-grade hardening of the 6 engine tables
-- ============================================================

-- ─── 1. ENSURE update_updated_at_column function exists ─────
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
  RETURNS TRIGGER LANGUAGE plpgsql
  SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ─── 2. UPDATED_AT TRIGGERS ─────────────────────────────────
DROP TRIGGER IF EXISTS trg_data_sources_updated_at ON public.data_sources;
CREATE TRIGGER trg_data_sources_updated_at
  BEFORE UPDATE ON public.data_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_signals_updated_at ON public.signals;
CREATE TRIGGER trg_signals_updated_at
  BEFORE UPDATE ON public.signals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_risk_register_updated_at ON public.risk_register;
CREATE TRIGGER trg_risk_register_updated_at
  BEFORE UPDATE ON public.risk_register
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_remediation_actions_updated_at ON public.remediation_actions;
CREATE TRIGGER trg_remediation_actions_updated_at
  BEFORE UPDATE ON public.remediation_actions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_commercial_config_updated_at ON public.commercial_config;
CREATE TRIGGER trg_commercial_config_updated_at
  BEFORE UPDATE ON public.commercial_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── 3. PERFORMANCE INDEXES ─────────────────────────────────

-- data_sources
CREATE INDEX IF NOT EXISTS idx_data_sources_org_id        ON public.data_sources (organization_id);
CREATE INDEX IF NOT EXISTS idx_data_sources_org_status     ON public.data_sources (organization_id, status);

-- source_sync_runs
CREATE INDEX IF NOT EXISTS idx_source_sync_runs_org_id     ON public.source_sync_runs (organization_id);
CREATE INDEX IF NOT EXISTS idx_source_sync_runs_source_id  ON public.source_sync_runs (source_id);
CREATE INDEX IF NOT EXISTS idx_source_sync_runs_org_status ON public.source_sync_runs (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_source_sync_runs_started_at ON public.source_sync_runs (organization_id, started_at DESC);

-- signals
CREATE INDEX IF NOT EXISTS idx_signals_org_id              ON public.signals (organization_id);
CREATE INDEX IF NOT EXISTS idx_signals_source_id           ON public.signals (source_id);
CREATE INDEX IF NOT EXISTS idx_signals_asset_id            ON public.signals (asset_id) WHERE asset_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_signals_org_status          ON public.signals (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_signals_org_severity        ON public.signals (organization_id, severity);
CREATE INDEX IF NOT EXISTS idx_signals_org_detected_at     ON public.signals (organization_id, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_signals_org_dedupe          ON public.signals (organization_id, dedupe_key) WHERE dedupe_key IS NOT NULL;

-- risk_register
CREATE INDEX IF NOT EXISTS idx_risk_register_org_id        ON public.risk_register (organization_id);
CREATE INDEX IF NOT EXISTS idx_risk_register_org_status    ON public.risk_register (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_risk_register_org_level     ON public.risk_register (organization_id, risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_register_asset_id      ON public.risk_register (asset_id) WHERE asset_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_risk_register_org_score     ON public.risk_register (organization_id, score DESC);

-- remediation_actions
CREATE INDEX IF NOT EXISTS idx_remediation_actions_org_id  ON public.remediation_actions (organization_id);
CREATE INDEX IF NOT EXISTS idx_remediation_actions_risk_id ON public.remediation_actions (risk_id);
CREATE INDEX IF NOT EXISTS idx_remediation_actions_status  ON public.remediation_actions (organization_id, status);
CREATE INDEX IF NOT EXISTS idx_remediation_actions_prio    ON public.remediation_actions (organization_id, priority);
CREATE INDEX IF NOT EXISTS idx_remediation_actions_due     ON public.remediation_actions (organization_id, due_date) WHERE due_date IS NOT NULL;

-- ai_analyses
CREATE INDEX IF NOT EXISTS idx_ai_analyses_org_id          ON public.ai_analyses (organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_entity          ON public.ai_analyses (entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ai_analyses_created_at      ON public.ai_analyses (organization_id, created_at DESC);

-- ─── 4. FOREIGN KEY CONSTRAINTS ─────────────────────────────

-- source_sync_runs
ALTER TABLE public.source_sync_runs
  DROP CONSTRAINT IF EXISTS fk_source_sync_runs_source_id;
ALTER TABLE public.source_sync_runs
  ADD CONSTRAINT fk_source_sync_runs_source_id
    FOREIGN KEY (source_id) REFERENCES public.data_sources (id) ON DELETE CASCADE;

ALTER TABLE public.source_sync_runs
  DROP CONSTRAINT IF EXISTS fk_source_sync_runs_org_id;
ALTER TABLE public.source_sync_runs
  ADD CONSTRAINT fk_source_sync_runs_org_id
    FOREIGN KEY (organization_id) REFERENCES public.organizations (id) ON DELETE CASCADE;

-- signals
ALTER TABLE public.signals
  DROP CONSTRAINT IF EXISTS fk_signals_source_id;
ALTER TABLE public.signals
  ADD CONSTRAINT fk_signals_source_id
    FOREIGN KEY (source_id) REFERENCES public.data_sources (id) ON DELETE RESTRICT;

ALTER TABLE public.signals
  DROP CONSTRAINT IF EXISTS fk_signals_org_id;
ALTER TABLE public.signals
  ADD CONSTRAINT fk_signals_org_id
    FOREIGN KEY (organization_id) REFERENCES public.organizations (id) ON DELETE CASCADE;

ALTER TABLE public.signals
  DROP CONSTRAINT IF EXISTS fk_signals_asset_id;
ALTER TABLE public.signals
  ADD CONSTRAINT fk_signals_asset_id
    FOREIGN KEY (asset_id) REFERENCES public.assets (id) ON DELETE SET NULL;

-- risk_register
ALTER TABLE public.risk_register
  DROP CONSTRAINT IF EXISTS fk_risk_register_org_id;
ALTER TABLE public.risk_register
  ADD CONSTRAINT fk_risk_register_org_id
    FOREIGN KEY (organization_id) REFERENCES public.organizations (id) ON DELETE CASCADE;

ALTER TABLE public.risk_register
  DROP CONSTRAINT IF EXISTS fk_risk_register_asset_id;
ALTER TABLE public.risk_register
  ADD CONSTRAINT fk_risk_register_asset_id
    FOREIGN KEY (asset_id) REFERENCES public.assets (id) ON DELETE SET NULL;

-- remediation_actions
ALTER TABLE public.remediation_actions
  DROP CONSTRAINT IF EXISTS fk_remediation_actions_org_id;
ALTER TABLE public.remediation_actions
  ADD CONSTRAINT fk_remediation_actions_org_id
    FOREIGN KEY (organization_id) REFERENCES public.organizations (id) ON DELETE CASCADE;

ALTER TABLE public.remediation_actions
  DROP CONSTRAINT IF EXISTS fk_remediation_actions_risk_id;
ALTER TABLE public.remediation_actions
  ADD CONSTRAINT fk_remediation_actions_risk_id
    FOREIGN KEY (risk_id) REFERENCES public.risk_register (id) ON DELETE CASCADE;

-- ai_analyses
ALTER TABLE public.ai_analyses
  DROP CONSTRAINT IF EXISTS fk_ai_analyses_org_id;
ALTER TABLE public.ai_analyses
  ADD CONSTRAINT fk_ai_analyses_org_id
    FOREIGN KEY (organization_id) REFERENCES public.organizations (id) ON DELETE CASCADE;

-- data_sources
ALTER TABLE public.data_sources
  DROP CONSTRAINT IF EXISTS fk_data_sources_org_id;
ALTER TABLE public.data_sources
  ADD CONSTRAINT fk_data_sources_org_id
    FOREIGN KEY (organization_id) REFERENCES public.organizations (id) ON DELETE CASCADE;

-- ─── 5. CHECK CONSTRAINTS ────────────────────────────────────

ALTER TABLE public.signals
  DROP CONSTRAINT IF EXISTS chk_signals_severity;
ALTER TABLE public.signals
  ADD CONSTRAINT chk_signals_severity
    CHECK (severity IN ('critical','high','medium','low','info'));

ALTER TABLE public.signals
  DROP CONSTRAINT IF EXISTS chk_signals_status;
ALTER TABLE public.signals
  ADD CONSTRAINT chk_signals_status
    CHECK (status IN ('new','acknowledged','correlated','closed'));

ALTER TABLE public.risk_register
  DROP CONSTRAINT IF EXISTS chk_risk_register_risk_level;
ALTER TABLE public.risk_register
  ADD CONSTRAINT chk_risk_register_risk_level
    CHECK (risk_level IN ('critical','high','medium','low'));

ALTER TABLE public.risk_register
  DROP CONSTRAINT IF EXISTS chk_risk_register_status;
ALTER TABLE public.risk_register
  ADD CONSTRAINT chk_risk_register_status
    CHECK (status IN ('open','in_treatment','accepted','closed'));

ALTER TABLE public.remediation_actions
  DROP CONSTRAINT IF EXISTS chk_remediation_actions_priority;
ALTER TABLE public.remediation_actions
  ADD CONSTRAINT chk_remediation_actions_priority
    CHECK (priority IN ('critical','high','medium','low'));

ALTER TABLE public.remediation_actions
  DROP CONSTRAINT IF EXISTS chk_remediation_actions_status;
ALTER TABLE public.remediation_actions
  ADD CONSTRAINT chk_remediation_actions_status
    CHECK (status IN ('open','in_progress','done','cancelled'));

ALTER TABLE public.data_sources
  DROP CONSTRAINT IF EXISTS chk_data_sources_status;
ALTER TABLE public.data_sources
  ADD CONSTRAINT chk_data_sources_status
    CHECK (status IN ('not_configured','active','error','disabled'));

-- ─── 6. UNIQUE CONSTRAINTS ───────────────────────────────────

-- Dedupe: same org + source + dedupe_key must be unique
ALTER TABLE public.signals
  DROP CONSTRAINT IF EXISTS uq_signals_org_source_dedupe;
ALTER TABLE public.signals
  ADD CONSTRAINT uq_signals_org_source_dedupe
    UNIQUE NULLS NOT DISTINCT (organization_id, source_id, dedupe_key);

-- One commercial_config per org
ALTER TABLE public.commercial_config
  DROP CONSTRAINT IF EXISTS uq_commercial_config_org;
ALTER TABLE public.commercial_config
  ADD CONSTRAINT uq_commercial_config_org
    UNIQUE (organization_id);

-- ─── 7. REALTIME PUBLICATION ─────────────────────────────────
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.signals;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.risk_register;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.remediation_actions;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;

-- ─── 8. RLS — ensure enabled ─────────────────────────────────
ALTER TABLE public.data_sources         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_sync_runs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signals              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_register        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.remediation_actions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analyses          ENABLE ROW LEVEL SECURITY;

-- ─── 9. RLS — ai_analyses: add admin delete ──────────────────
DROP POLICY IF EXISTS "Admins can delete AI analyses" ON public.ai_analyses;
CREATE POLICY "Admins can delete AI analyses"
  ON public.ai_analyses FOR DELETE
  USING (has_role(auth.uid(), organization_id, 'admin'::app_role));

-- ─── 10. FIX sales_leads RLS — use subquery not FROM alias ───
DROP POLICY IF EXISTS "Admins can view leads" ON public.sales_leads;
CREATE POLICY "Admins can view leads"
  ON public.sales_leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

DROP POLICY IF EXISTS "Admins can update leads" ON public.sales_leads;
CREATE POLICY "Admins can update leads"
  ON public.sales_leads FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

-- ─── 11. FIX conversion_events RLS ───────────────────────────
DROP POLICY IF EXISTS "Admins can view conversion events" ON public.conversion_events;
CREATE POLICY "Admins can view conversion events"
  ON public.conversion_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

-- ─── 12. HELPER: get_engine_summary ──────────────────────────
CREATE OR REPLACE FUNCTION public.get_engine_summary(_org_id uuid)
  RETURNS jsonb
  LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_sources   bigint;
  v_signals   bigint;
  v_risks     bigint;
  v_actions   bigint;
  v_analyses  bigint;
BEGIN
  IF NOT has_org_access(auth.uid(), _org_id) THEN
    RAISE EXCEPTION 'Access denied to organization';
  END IF;
  SELECT count(*) INTO v_sources  FROM public.data_sources        WHERE organization_id = _org_id AND status = 'active';
  SELECT count(*) INTO v_signals  FROM public.signals             WHERE organization_id = _org_id AND status IN ('new','acknowledged');
  SELECT count(*) INTO v_risks    FROM public.risk_register       WHERE organization_id = _org_id AND status = 'open';
  SELECT count(*) INTO v_actions  FROM public.remediation_actions WHERE organization_id = _org_id AND status IN ('open','in_progress');
  SELECT count(*) INTO v_analyses FROM public.ai_analyses         WHERE organization_id = _org_id;
  RETURN jsonb_build_object(
    'active_sources',  v_sources,
    'open_signals',    v_signals,
    'open_risks',      v_risks,
    'pending_actions', v_actions,
    'ai_analyses',     v_analyses,
    'checked_at',      now()
  );
END;
$$;
