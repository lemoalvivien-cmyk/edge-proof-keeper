
-- ═══════════════════════════════════════════════════════════════════════════════
-- SPRINT 0 — Subscription columns + has_active_subscription + delete_user_account
-- ═══════════════════════════════════════════════════════════════════════════════

-- ── 1. Add subscription columns to profiles ─────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_status  TEXT NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS subscription_plan    TEXT,
  ADD COLUMN IF NOT EXISTS subscription_end     TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS stripe_customer_id   TEXT;

-- ── 2. Helper: has_active_subscription (SECURITY DEFINER avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND subscription_status IN ('active', 'trialing')
  )
$$;

-- ── 3. RLS paywall policies on sensitive tables ──────────────────────────────

-- findings
DROP POLICY IF EXISTS "subscription_required_findings" ON public.findings;
CREATE POLICY "subscription_required_findings"
  ON public.findings FOR SELECT TO authenticated
  USING (has_org_access(auth.uid(), organization_id) AND has_active_subscription(auth.uid()));

-- risk_register
DROP POLICY IF EXISTS "subscription_required_risks" ON public.risk_register;
CREATE POLICY "subscription_required_risks"
  ON public.risk_register FOR SELECT TO authenticated
  USING (has_org_access(auth.uid(), organization_id) AND has_active_subscription(auth.uid()));

-- remediation_actions
DROP POLICY IF EXISTS "subscription_required_remediation" ON public.remediation_actions;
CREATE POLICY "subscription_required_remediation"
  ON public.remediation_actions FOR SELECT TO authenticated
  USING (has_org_access(auth.uid(), organization_id) AND has_active_subscription(auth.uid()));

-- tool_runs
DROP POLICY IF EXISTS "subscription_required_tool_runs" ON public.tool_runs;
CREATE POLICY "subscription_required_tool_runs"
  ON public.tool_runs FOR SELECT TO authenticated
  USING (has_org_access(auth.uid(), organization_id) AND has_active_subscription(auth.uid()));

-- evidence_log
DROP POLICY IF EXISTS "subscription_required_evidence" ON public.evidence_log;
CREATE POLICY "subscription_required_evidence"
  ON public.evidence_log FOR SELECT TO authenticated
  USING (has_org_access(auth.uid(), organization_id) AND has_active_subscription(auth.uid()));

-- assets
DROP POLICY IF EXISTS "subscription_required_assets" ON public.assets;
CREATE POLICY "subscription_required_assets"
  ON public.assets FOR SELECT TO authenticated
  USING (has_org_access(auth.uid(), organization_id) AND has_active_subscription(auth.uid()));

-- reports
DROP POLICY IF EXISTS "subscription_required_reports" ON public.reports;
CREATE POLICY "subscription_required_reports"
  ON public.reports FOR SELECT TO authenticated
  USING (has_org_access(auth.uid(), organization_id) AND has_active_subscription(auth.uid()));

-- signals
DROP POLICY IF EXISTS "subscription_required_signals" ON public.signals;
CREATE POLICY "subscription_required_signals"
  ON public.signals FOR SELECT TO authenticated
  USING (has_org_access(auth.uid(), organization_id) AND has_active_subscription(auth.uid()));

-- ── 4. delete_user_account RPC (GDPR Art.17) ────────────────────────────────
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_org_id  UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT organization_id INTO v_org_id
  FROM public.profiles WHERE id = v_user_id;

  DELETE FROM public.user_roles WHERE user_id = v_user_id;
  DELETE FROM public.profiles    WHERE id = v_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
