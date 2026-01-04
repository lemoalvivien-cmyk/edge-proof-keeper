-- Create reports table
CREATE TABLE public.reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  tool_run_id UUID NOT NULL REFERENCES public.tool_runs(id) UNIQUE,
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'ready', 'failed')),
  executive_md TEXT,
  technical_md TEXT,
  executive_json JSONB,
  technical_json JSONB,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Org members can view reports"
ON public.reports
FOR SELECT
USING (has_org_access(auth.uid(), organization_id));

CREATE POLICY "Org members can create reports"
ON public.reports
FOR INSERT
WITH CHECK (
  has_org_access(auth.uid(), organization_id)
  AND created_by = auth.uid()
);

CREATE POLICY "Creators and admins can update reports"
ON public.reports
FOR UPDATE
USING (
  has_org_access(auth.uid(), organization_id)
  AND (created_by = auth.uid() OR has_role(auth.uid(), organization_id, 'admin'::app_role))
);

-- Performance indexes
CREATE INDEX idx_reports_org_created ON public.reports(organization_id, created_at DESC);
CREATE INDEX idx_reports_tool_run ON public.reports(tool_run_id);

-- Trigger for updated_at
CREATE TRIGGER update_reports_updated_at
BEFORE UPDATE ON public.reports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();