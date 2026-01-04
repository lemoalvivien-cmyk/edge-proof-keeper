-- A) FK requested_by -> auth.users
ALTER TABLE public.tool_runs
ADD CONSTRAINT tool_runs_requested_by_fkey 
FOREIGN KEY (requested_by) REFERENCES auth.users(id);

-- B) Trigger to prevent modification of immutable fields
CREATE OR REPLACE FUNCTION public.prevent_tool_run_immutable_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if any immutable field is being changed
  IF OLD.organization_id IS DISTINCT FROM NEW.organization_id THEN
    RAISE EXCEPTION 'Cannot modify organization_id on tool_runs';
  END IF;
  
  IF OLD.authorization_id IS DISTINCT FROM NEW.authorization_id THEN
    RAISE EXCEPTION 'Cannot modify authorization_id on tool_runs';
  END IF;
  
  IF OLD.tool_id IS DISTINCT FROM NEW.tool_id THEN
    RAISE EXCEPTION 'Cannot modify tool_id on tool_runs';
  END IF;
  
  IF OLD.requested_by IS DISTINCT FROM NEW.requested_by THEN
    RAISE EXCEPTION 'Cannot modify requested_by on tool_runs';
  END IF;
  
  IF OLD.requested_at IS DISTINCT FROM NEW.requested_at THEN
    RAISE EXCEPTION 'Cannot modify requested_at on tool_runs';
  END IF;
  
  -- Allow only mutable fields: status, completed_at, input_artifact_url, input_artifact_hash, normalized_output, summary, preset_id, asset_id, mode
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_tool_run_immutability
BEFORE UPDATE ON public.tool_runs
FOR EACH ROW
EXECUTE FUNCTION public.prevent_tool_run_immutable_changes();

-- C) Replace UPDATE policy with stricter WITH CHECK
DROP POLICY IF EXISTS "Requesters and admins can update tool runs" ON public.tool_runs;

CREATE POLICY "Requesters and admins can update tool runs with validation"
ON public.tool_runs
FOR UPDATE
USING (
  has_org_access(auth.uid(), organization_id)
  AND (requested_by = auth.uid() OR has_role(auth.uid(), organization_id, 'admin'::app_role))
)
WITH CHECK (
  has_org_access(auth.uid(), organization_id)
  AND (requested_by = auth.uid() OR has_role(auth.uid(), organization_id, 'admin'::app_role))
  AND authorization_belongs_to_org(authorization_id, organization_id)
  AND is_authorization_valid(authorization_id)
);