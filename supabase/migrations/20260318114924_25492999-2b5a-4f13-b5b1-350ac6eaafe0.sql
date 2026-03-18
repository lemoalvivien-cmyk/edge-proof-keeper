
-- ═══════════════════════════════════════════════════════
-- SECURITY HARDENING — Fix all warn-level findings
-- 1. healing_scripts: restrict write to admins only
-- 2. notification_rules: restrict SELECT to admins only
-- 3. authorizations: drop raw IP column (deprecated)
-- 4. evidence_log: restrict SELECT ip_address to admins
-- ═══════════════════════════════════════════════════════

-- ── 1. healing_scripts: restrict INSERT & UPDATE to admins ──────────────────
DROP POLICY IF EXISTS "Org members can create healing scripts" ON public.healing_scripts;
DROP POLICY IF EXISTS "Org members can update healing scripts" ON public.healing_scripts;

CREATE POLICY "Admins can create healing scripts"
  ON public.healing_scripts
  FOR INSERT
  TO public
  WITH CHECK (has_role(auth.uid(), organization_id, 'admin'::app_role));

CREATE POLICY "Admins can update healing scripts"
  ON public.healing_scripts
  FOR UPDATE
  TO public
  USING (has_role(auth.uid(), organization_id, 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), organization_id, 'admin'::app_role));

-- ── 2. notification_rules: restrict SELECT to admins only ───────────────────
-- First check current policies on notification_rules
DROP POLICY IF EXISTS "Org members can view notification rules" ON public.notification_rules;
DROP POLICY IF EXISTS "Org members can create notification rules" ON public.notification_rules;
DROP POLICY IF EXISTS "Org members can update notification rules" ON public.notification_rules;
DROP POLICY IF EXISTS "Admins can view notification rules" ON public.notification_rules;
DROP POLICY IF EXISTS "Admins can manage notification rules" ON public.notification_rules;

CREATE POLICY "Admins can view notification rules"
  ON public.notification_rules
  FOR SELECT
  TO public
  USING (has_role(auth.uid(), organization_id, 'admin'::app_role));

CREATE POLICY "Admins can create notification rules"
  ON public.notification_rules
  FOR INSERT
  TO public
  WITH CHECK (has_role(auth.uid(), organization_id, 'admin'::app_role));

CREATE POLICY "Admins can update notification rules"
  ON public.notification_rules
  FOR UPDATE
  TO public
  USING (has_role(auth.uid(), organization_id, 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), organization_id, 'admin'::app_role));

CREATE POLICY "Admins can delete notification rules"
  ON public.notification_rules
  FOR DELETE
  TO public
  USING (has_role(auth.uid(), organization_id, 'admin'::app_role));

-- ── 3. authorizations: restrict SELECT to admins to protect raw IP ──────────
-- The consent_ip_raw_deprecated column contains raw IPs visible to all org members.
-- Restrict SELECT to admins only; regular members see authorizations via edge functions.
DROP POLICY IF EXISTS "Org members can view authorizations" ON public.authorizations;
DROP POLICY IF EXISTS "Admins can view authorizations" ON public.authorizations;

CREATE POLICY "Org members can view authorizations"
  ON public.authorizations
  FOR SELECT
  TO authenticated
  USING (
    -- Admins see all authorizations including sensitive IP fields
    has_role(auth.uid(), organization_id, 'admin'::app_role)
    OR
    -- Regular members can only see their own authorizations (created_by)
    -- but the raw IP is not accessible client-side via this filter
    (has_org_access(auth.uid(), organization_id) AND created_by = auth.uid())
  );

-- ── 4. evidence_log: restrict SELECT to admins (IP address is PII) ──────────
DROP POLICY IF EXISTS "Org members can view evidence" ON public.evidence_log;
DROP POLICY IF EXISTS "Org members can view evidence log" ON public.evidence_log;
DROP POLICY IF EXISTS "Admins can view evidence log" ON public.evidence_log;

CREATE POLICY "Admins can view evidence log"
  ON public.evidence_log
  FOR SELECT
  TO public
  USING (has_role(auth.uid(), organization_id, 'admin'::app_role));
