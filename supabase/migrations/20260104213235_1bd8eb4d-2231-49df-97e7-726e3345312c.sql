-- =====================================================
-- A) EVIDENCE VAULT PROOF MODE + HASH CHAIN
-- =====================================================

-- A1) Drop client INSERT policy on evidence_log (server-only inserts)
DROP POLICY IF EXISTS "Org members can insert evidence" ON public.evidence_log;

-- A2) Add hash chain columns to evidence_log
ALTER TABLE public.evidence_log
ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'server',
ADD COLUMN IF NOT EXISTS seq bigint,
ADD COLUMN IF NOT EXISTS prev_hash text,
ADD COLUMN IF NOT EXISTS entry_hash text;

-- Add CHECK constraint for source
ALTER TABLE public.evidence_log
ADD CONSTRAINT evidence_log_source_check CHECK (source IN ('server', 'client'));

-- Create evidence_chain_state table for tracking hash chain per org
CREATE TABLE IF NOT EXISTS public.evidence_chain_state (
  organization_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  last_seq bigint NOT NULL DEFAULT 0,
  last_hash text NOT NULL DEFAULT 'GENESIS'
);

-- Enable RLS on evidence_chain_state but NO policies (server-only access via service role)
ALTER TABLE public.evidence_chain_state ENABLE ROW LEVEL SECURITY;

-- A3) Create trigger function for hash chain computation
CREATE OR REPLACE FUNCTION public.compute_evidence_hash_chain()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_seq bigint;
  v_last_hash text;
  v_new_hash text;
  v_payload text;
BEGIN
  -- Lock and get/create chain state for this org
  INSERT INTO public.evidence_chain_state (organization_id, last_seq, last_hash)
  VALUES (NEW.organization_id, 0, 'GENESIS')
  ON CONFLICT (organization_id) DO NOTHING;
  
  SELECT last_seq, last_hash INTO v_last_seq, v_last_hash
  FROM public.evidence_chain_state
  WHERE organization_id = NEW.organization_id
  FOR UPDATE;
  
  -- Compute new seq and prev_hash
  NEW.seq := v_last_seq + 1;
  NEW.prev_hash := v_last_hash;
  
  -- Build payload for hash computation
  v_payload := concat_ws('|',
    NEW.organization_id::text,
    NEW.seq::text,
    COALESCE(NEW.user_id::text, ''),
    NEW.action,
    NEW.entity_type,
    COALESCE(NEW.entity_id::text, ''),
    COALESCE(NEW.artifact_hash, ''),
    COALESCE(NEW.ip_address, ''),
    COALESCE(NEW.created_at::text, ''),
    NEW.prev_hash
  );
  
  -- Compute entry hash using SHA-256
  NEW.entry_hash := encode(sha256(v_payload::bytea), 'hex');
  
  -- Update chain state
  UPDATE public.evidence_chain_state
  SET last_seq = NEW.seq, last_hash = NEW.entry_hash
  WHERE organization_id = NEW.organization_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger for hash chain
DROP TRIGGER IF EXISTS compute_evidence_hash_chain_trigger ON public.evidence_log;
CREATE TRIGGER compute_evidence_hash_chain_trigger
  BEFORE INSERT ON public.evidence_log
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_evidence_hash_chain();

-- Add indexes for evidence_log
CREATE INDEX IF NOT EXISTS idx_evidence_log_org_seq ON public.evidence_log(organization_id, seq DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_log_org_created ON public.evidence_log(organization_id, created_at DESC);

-- =====================================================
-- B) HARDEN FINDINGS
-- =====================================================

-- B1) Create immutability trigger for findings
CREATE OR REPLACE FUNCTION public.prevent_finding_immutable_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent modification of immutable fields
  IF OLD.organization_id IS DISTINCT FROM NEW.organization_id THEN
    RAISE EXCEPTION 'Cannot modify organization_id on findings';
  END IF;
  
  IF OLD.tool_run_id IS DISTINCT FROM NEW.tool_run_id THEN
    RAISE EXCEPTION 'Cannot modify tool_run_id on findings';
  END IF;
  
  IF OLD.asset_id IS DISTINCT FROM NEW.asset_id THEN
    RAISE EXCEPTION 'Cannot modify asset_id on findings';
  END IF;
  
  IF OLD.first_seen IS DISTINCT FROM NEW.first_seen THEN
    RAISE EXCEPTION 'Cannot modify first_seen on findings';
  END IF;
  
  -- Allow only mutable fields: status, updated_at, title, severity, confidence, evidence, references
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_finding_immutable_changes_trigger ON public.findings;
CREATE TRIGGER prevent_finding_immutable_changes_trigger
  BEFORE UPDATE ON public.findings
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_finding_immutable_changes();

-- B2) Drop and recreate UPDATE policy with explicit WITH CHECK
DROP POLICY IF EXISTS "Tool run requesters and admins can update findings" ON public.findings;

CREATE POLICY "Tool run requesters and admins can update findings with check"
ON public.findings
FOR UPDATE
USING (
  has_org_access(auth.uid(), organization_id)
  AND EXISTS (
    SELECT 1 FROM public.tool_runs tr
    WHERE tr.id = findings.tool_run_id
    AND (tr.requested_by = auth.uid() OR has_role(auth.uid(), organization_id, 'admin'::app_role))
  )
)
WITH CHECK (
  has_org_access(auth.uid(), organization_id)
  AND EXISTS (
    SELECT 1 FROM public.tool_runs tr
    WHERE tr.id = findings.tool_run_id
    AND (tr.requested_by = auth.uid() OR has_role(auth.uid(), organization_id, 'admin'::app_role))
  )
);

-- =====================================================
-- C) REMEDIATION ENGINE
-- =====================================================

-- C1) Create remediation_tasks table
CREATE TABLE IF NOT EXISTS public.remediation_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  finding_id uuid REFERENCES public.findings(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  priority public.risk_level NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'blocked', 'done', 'cancelled')),
  owner_id uuid,
  due_date date,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

-- C1) Create task_comments table
CREATE TABLE IF NOT EXISTS public.task_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.remediation_tasks(id) ON DELETE CASCADE,
  author_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- C2) Create indexes for remediation_tasks
CREATE INDEX IF NOT EXISTS idx_remediation_tasks_org_status ON public.remediation_tasks(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_remediation_tasks_org_priority ON public.remediation_tasks(organization_id, priority);
CREATE INDEX IF NOT EXISTS idx_remediation_tasks_org_due_date ON public.remediation_tasks(organization_id, due_date);
CREATE INDEX IF NOT EXISTS idx_remediation_tasks_finding ON public.remediation_tasks(finding_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_created ON public.task_comments(task_id, created_at);

-- C3) Enable RLS on remediation tables
ALTER TABLE public.remediation_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_comments ENABLE ROW LEVEL SECURITY;

-- RLS policies for remediation_tasks
CREATE POLICY "Org members can view remediation tasks"
ON public.remediation_tasks
FOR SELECT
USING (has_org_access(auth.uid(), organization_id));

CREATE POLICY "Org members can create remediation tasks"
ON public.remediation_tasks
FOR INSERT
WITH CHECK (has_org_access(auth.uid(), organization_id) AND created_by = auth.uid());

CREATE POLICY "Task owners and admins can update remediation tasks"
ON public.remediation_tasks
FOR UPDATE
USING (
  has_org_access(auth.uid(), organization_id)
  AND (
    created_by = auth.uid()
    OR owner_id = auth.uid()
    OR has_role(auth.uid(), organization_id, 'admin'::app_role)
  )
)
WITH CHECK (
  has_org_access(auth.uid(), organization_id)
  AND (
    created_by = auth.uid()
    OR owner_id = auth.uid()
    OR has_role(auth.uid(), organization_id, 'admin'::app_role)
  )
);

-- No DELETE policy (history preserved)

-- RLS policies for task_comments
CREATE POLICY "Org members can view task comments"
ON public.task_comments
FOR SELECT
USING (has_org_access(auth.uid(), organization_id));

CREATE POLICY "Org members can create task comments"
ON public.task_comments
FOR INSERT
WITH CHECK (has_org_access(auth.uid(), organization_id) AND author_id = auth.uid());

-- No UPDATE/DELETE policies (comments are immutable)

-- C4) Create updated_at trigger for remediation_tasks
DROP TRIGGER IF EXISTS update_remediation_tasks_updated_at ON public.remediation_tasks;
CREATE TRIGGER update_remediation_tasks_updated_at
  BEFORE UPDATE ON public.remediation_tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();