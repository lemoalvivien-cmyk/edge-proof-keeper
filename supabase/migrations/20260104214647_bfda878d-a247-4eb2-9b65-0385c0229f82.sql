-- A1) Create sha256_hex function using built-in sha256 (available in PostgreSQL 14+)
CREATE OR REPLACE FUNCTION public.sha256_hex(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT encode(sha256(convert_to(input, 'UTF8')), 'hex')
$$;

-- A2) Update compute_evidence_hash_chain to be deterministic
CREATE OR REPLACE FUNCTION public.compute_evidence_hash_chain()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_last_seq bigint;
  v_last_hash text;
  v_payload text;
BEGIN
  -- Force created_at to be deterministic
  NEW.created_at := COALESCE(NEW.created_at, now());
  
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
  
  -- Build deterministic payload for hash computation
  v_payload := concat_ws('|',
    NEW.organization_id::text,
    NEW.seq::text,
    COALESCE(NEW.user_id::text, ''),
    NEW.action,
    NEW.entity_type,
    COALESCE(NEW.entity_id::text, ''),
    COALESCE(NEW.artifact_hash, ''),
    COALESCE(NEW.ip_address, ''),
    NEW.created_at::text,
    NEW.prev_hash
  );
  
  -- Compute entry hash using sha256_hex
  NEW.entry_hash := sha256_hex(v_payload);
  
  -- Update chain state
  UPDATE public.evidence_chain_state
  SET last_seq = NEW.seq, last_hash = NEW.entry_hash
  WHERE organization_id = NEW.organization_id;
  
  RETURN NEW;
END;
$$;

-- A3) Add UNIQUE index on (organization_id, seq)
CREATE UNIQUE INDEX IF NOT EXISTS idx_evidence_log_org_seq_unique 
ON public.evidence_log (organization_id, seq);

-- A4) Create trigger to prevent UPDATE/DELETE on evidence_log
CREATE OR REPLACE FUNCTION public.prevent_evidence_mutations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Evidence log is immutable - % operations are not allowed', TG_OP;
END;
$$;

DROP TRIGGER IF EXISTS prevent_evidence_mutations_trigger ON public.evidence_log;
CREATE TRIGGER prevent_evidence_mutations_trigger
BEFORE UPDATE OR DELETE ON public.evidence_log
FOR EACH ROW
EXECUTE FUNCTION public.prevent_evidence_mutations();

-- B1) Add FKs to auth.users (if not already present)
DO $$
BEGIN
  -- Check and add FK for remediation_tasks.created_by
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'remediation_tasks_created_by_fkey'
  ) THEN
    ALTER TABLE public.remediation_tasks
    ADD CONSTRAINT remediation_tasks_created_by_fkey
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  
  -- Check and add FK for remediation_tasks.owner_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'remediation_tasks_owner_id_fkey'
  ) THEN
    ALTER TABLE public.remediation_tasks
    ADD CONSTRAINT remediation_tasks_owner_id_fkey
    FOREIGN KEY (owner_id) REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
  
  -- Check and add FK for task_comments.author_id
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'task_comments_author_id_fkey'
  ) THEN
    ALTER TABLE public.task_comments
    ADD CONSTRAINT task_comments_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- B2) Trigger to validate remediation_tasks org consistency
CREATE OR REPLACE FUNCTION public.validate_remediation_task_org()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_finding_org uuid;
BEGIN
  -- If finding_id is set, verify org matches
  IF NEW.finding_id IS NOT NULL THEN
    SELECT organization_id INTO v_finding_org
    FROM public.findings
    WHERE id = NEW.finding_id;
    
    IF v_finding_org IS NULL THEN
      RAISE EXCEPTION 'Finding not found: %', NEW.finding_id;
    END IF;
    
    IF v_finding_org != NEW.organization_id THEN
      RAISE EXCEPTION 'Finding organization mismatch: task org % != finding org %', 
        NEW.organization_id, v_finding_org;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_remediation_task_org_trigger ON public.remediation_tasks;
CREATE TRIGGER validate_remediation_task_org_trigger
BEFORE INSERT OR UPDATE ON public.remediation_tasks
FOR EACH ROW
EXECUTE FUNCTION public.validate_remediation_task_org();

-- B2) Trigger to enforce task_comments org consistency
CREATE OR REPLACE FUNCTION public.enforce_task_comment_org()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task_org uuid;
BEGIN
  -- Get the task's organization_id
  SELECT organization_id INTO v_task_org
  FROM public.remediation_tasks
  WHERE id = NEW.task_id;
  
  IF v_task_org IS NULL THEN
    RAISE EXCEPTION 'Task not found: %', NEW.task_id;
  END IF;
  
  -- Force organization_id to match the task's org
  IF NEW.organization_id != v_task_org THEN
    RAISE EXCEPTION 'Comment organization mismatch: provided org % != task org %',
      NEW.organization_id, v_task_org;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_task_comment_org_trigger ON public.task_comments;
CREATE TRIGGER enforce_task_comment_org_trigger
BEFORE INSERT ON public.task_comments
FOR EACH ROW
EXECUTE FUNCTION public.enforce_task_comment_org();

-- B3) Trigger for auto closed_at management
CREATE OR REPLACE FUNCTION public.manage_task_closed_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If status changes to done or cancelled, set closed_at
  IF NEW.status IN ('done', 'cancelled') AND OLD.status NOT IN ('done', 'cancelled') THEN
    NEW.closed_at := COALESCE(NEW.closed_at, now());
  -- If status changes from done/cancelled to something else, clear closed_at
  ELSIF OLD.status IN ('done', 'cancelled') AND NEW.status NOT IN ('done', 'cancelled') THEN
    NEW.closed_at := NULL;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS manage_task_closed_at_trigger ON public.remediation_tasks;
CREATE TRIGGER manage_task_closed_at_trigger
BEFORE UPDATE ON public.remediation_tasks
FOR EACH ROW
EXECUTE FUNCTION public.manage_task_closed_at();

-- C) RLS - strengthen task_comments INSERT policy
DROP POLICY IF EXISTS "Org members can create task comments" ON public.task_comments;

CREATE POLICY "Org members can create task comments"
ON public.task_comments
FOR INSERT
WITH CHECK (
  author_id = auth.uid()
  AND has_org_access(auth.uid(), organization_id)
  AND EXISTS (
    SELECT 1 FROM public.remediation_tasks t
    WHERE t.id = task_id
      AND t.organization_id = task_comments.organization_id
  )
);