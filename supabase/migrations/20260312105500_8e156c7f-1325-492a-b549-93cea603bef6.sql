CREATE INDEX IF NOT EXISTS idx_remediation_actions_org_risk_status
  ON public.remediation_actions (organization_id, risk_id, status);

CREATE INDEX IF NOT EXISTS idx_remediation_actions_org_status_priority
  ON public.remediation_actions (organization_id, status, priority);

CREATE INDEX IF NOT EXISTS idx_risk_register_org_status_score
  ON public.risk_register (organization_id, status, score DESC);