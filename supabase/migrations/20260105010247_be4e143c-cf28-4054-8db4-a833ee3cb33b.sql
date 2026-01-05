-- =====================================================
-- PHASE 2 & 3: Evidence Vault WORM + RGPD + Retention
-- =====================================================

-- A) Storage WORM policies - Prevent DELETE on authorizations and artifacts buckets
-- Note: Buckets already exist, we add/update policies

-- Remove any existing DELETE policies on authorizations bucket
DROP POLICY IF EXISTS "Admin delete authorizations" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete authorizations" ON storage.objects;

-- Remove any existing DELETE policies on artifacts bucket
DROP POLICY IF EXISTS "Admin delete artifacts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete artifacts" ON storage.objects;

-- Explicitly deny DELETE on WORM buckets (authorizations, artifacts)
-- No DELETE policy = WORM behavior

-- B) Create retention_policies table for configurable retention
CREATE TABLE IF NOT EXISTS public.retention_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  logs_detail_months integer NOT NULL DEFAULT 36,
  artifacts_years integer NOT NULL DEFAULT 7,
  reports_years integer NOT NULL DEFAULT 10,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_retention_org UNIQUE (organization_id),
  CONSTRAINT chk_logs_months CHECK (logs_detail_months >= 12),
  CONSTRAINT chk_artifacts_years CHECK (artifacts_years >= 1),
  CONSTRAINT chk_reports_years CHECK (reports_years >= 1)
);

-- RLS for retention_policies
ALTER TABLE public.retention_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view retention policies"
  ON public.retention_policies FOR SELECT
  USING (has_role(auth.uid(), organization_id, 'admin'));

CREATE POLICY "Admins can manage retention policies"
  ON public.retention_policies FOR ALL
  USING (has_role(auth.uid(), organization_id, 'admin'))
  WITH CHECK (has_role(auth.uid(), organization_id, 'admin'));

-- C) Add evidence_refs and model_limits to reports for anti-hallucination
ALTER TABLE public.reports 
  ADD COLUMN IF NOT EXISTS evidence_refs jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS model_limits jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS fact_pack_hash text;

-- D) Add consent requirement check function
CREATE OR REPLACE FUNCTION public.has_consent_proof(_auth_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.authorizations
    WHERE id = _auth_id
      AND consent_checkbox = true
      AND consent_text_version IS NOT NULL
      AND consent_text_hash IS NOT NULL
  )
$$;

REVOKE ALL ON FUNCTION public.has_consent_proof(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_consent_proof(uuid) TO authenticated;

-- E) Function to log scope mismatch attempts (called from Edge Functions)
-- This is logged via evidence_log with action = 'blocked_scope_mismatch'

-- F) Create indexes for performance on large datasets
CREATE INDEX IF NOT EXISTS idx_findings_org_severity ON public.findings(organization_id, severity);
CREATE INDEX IF NOT EXISTS idx_findings_org_status ON public.findings(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_findings_org_first_seen ON public.findings(organization_id, first_seen DESC);
CREATE INDEX IF NOT EXISTS idx_findings_tool_run ON public.findings(tool_run_id);
CREATE INDEX IF NOT EXISTS idx_evidence_log_org_seq ON public.evidence_log(organization_id, seq DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_log_org_action ON public.evidence_log(organization_id, action);
CREATE INDEX IF NOT EXISTS idx_tool_runs_org_status ON public.tool_runs(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_tool_runs_requested_at ON public.tool_runs(organization_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_org_status ON public.reports(organization_id, status);

-- G) Add fingerprint column to findings for deduplication
ALTER TABLE public.findings ADD COLUMN IF NOT EXISTS fingerprint text;
CREATE UNIQUE INDEX IF NOT EXISTS idx_findings_fingerprint_org ON public.findings(organization_id, fingerprint) WHERE fingerprint IS NOT NULL;

-- H) Comments for documentation
COMMENT ON TABLE public.retention_policies IS 'Organization-specific data retention configuration';
COMMENT ON COLUMN public.reports.evidence_refs IS 'References to supporting evidence (finding_ids, artifact_hashes)';
COMMENT ON COLUMN public.reports.model_limits IS 'AI model limitations and caveats for this report';
COMMENT ON COLUMN public.reports.fact_pack_hash IS 'SHA-256 hash of the fact_pack used to generate report';
COMMENT ON COLUMN public.findings.fingerprint IS 'Unique fingerprint for deduplication within org';