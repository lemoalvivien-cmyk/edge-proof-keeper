-- A) Create findings table
CREATE TABLE public.findings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  tool_run_id uuid NOT NULL REFERENCES public.tool_runs(id),
  asset_id uuid REFERENCES public.assets(id),
  title text NOT NULL,
  finding_type text NOT NULL DEFAULT 'unknown',
  severity public.risk_level NOT NULL DEFAULT 'info',
  confidence text NOT NULL DEFAULT 'low' CHECK (confidence IN ('high', 'medium', 'low')),
  evidence jsonb DEFAULT '{}',
  "references" text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'triaged', 'resolved', 'false_positive')),
  first_seen timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_findings_org_severity ON public.findings(organization_id, severity);
CREATE INDEX idx_findings_org_status ON public.findings(organization_id, status);
CREATE INDEX idx_findings_tool_run ON public.findings(tool_run_id);

-- RLS Policies
CREATE POLICY "Org members can view findings"
  ON public.findings
  FOR SELECT
  USING (has_org_access(auth.uid(), organization_id));

CREATE POLICY "Tool run requesters and admins can insert findings"
  ON public.findings
  FOR INSERT
  WITH CHECK (
    has_org_access(auth.uid(), organization_id)
    AND EXISTS (
      SELECT 1 FROM public.tool_runs tr
      WHERE tr.id = tool_run_id
      AND (tr.requested_by = auth.uid() OR has_role(auth.uid(), organization_id, 'admin'::app_role))
    )
  );

CREATE POLICY "Tool run requesters and admins can update findings"
  ON public.findings
  FOR UPDATE
  USING (
    has_org_access(auth.uid(), organization_id)
    AND EXISTS (
      SELECT 1 FROM public.tool_runs tr
      WHERE tr.id = tool_run_id
      AND (tr.requested_by = auth.uid() OR has_role(auth.uid(), organization_id, 'admin'::app_role))
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_findings_updated_at
  BEFORE UPDATE ON public.findings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- B) Create finding_control_links table for GDPR/NIS2 mapping
CREATE TABLE public.finding_control_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  finding_id uuid NOT NULL REFERENCES public.findings(id) ON DELETE CASCADE,
  framework public.compliance_framework NOT NULL,
  control_id uuid NOT NULL REFERENCES public.compliance_controls(id),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(finding_id, control_id)
);

-- Enable RLS
ALTER TABLE public.finding_control_links ENABLE ROW LEVEL SECURITY;

-- Index
CREATE INDEX idx_finding_control_links_finding ON public.finding_control_links(finding_id);

-- RLS Policies (inherit from findings access)
CREATE POLICY "Org members can view finding control links"
  ON public.finding_control_links
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.findings f
      WHERE f.id = finding_id
      AND has_org_access(auth.uid(), f.organization_id)
    )
  );

CREATE POLICY "Finding owners can manage control links"
  ON public.finding_control_links
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.findings f
      JOIN public.tool_runs tr ON tr.id = f.tool_run_id
      WHERE f.id = finding_id
      AND has_org_access(auth.uid(), f.organization_id)
      AND (tr.requested_by = auth.uid() OR has_role(auth.uid(), f.organization_id, 'admin'::app_role))
    )
  );

CREATE POLICY "Finding owners can delete control links"
  ON public.finding_control_links
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.findings f
      JOIN public.tool_runs tr ON tr.id = f.tool_run_id
      WHERE f.id = finding_id
      AND has_org_access(auth.uid(), f.organization_id)
      AND (tr.requested_by = auth.uid() OR has_role(auth.uid(), f.organization_id, 'admin'::app_role))
    )
  );