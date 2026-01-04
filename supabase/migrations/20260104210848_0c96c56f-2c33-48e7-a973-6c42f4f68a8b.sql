-- A) Immutability trigger for reports
CREATE OR REPLACE FUNCTION public.prevent_report_immutable_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Prevent modification of immutable fields
  IF OLD.organization_id IS DISTINCT FROM NEW.organization_id THEN
    RAISE EXCEPTION 'Cannot modify organization_id on reports';
  END IF;
  
  IF OLD.tool_run_id IS DISTINCT FROM NEW.tool_run_id THEN
    RAISE EXCEPTION 'Cannot modify tool_run_id on reports';
  END IF;
  
  IF OLD.created_by IS DISTINCT FROM NEW.created_by THEN
    RAISE EXCEPTION 'Cannot modify created_by on reports';
  END IF;
  
  IF OLD.created_at IS DISTINCT FROM NEW.created_at THEN
    RAISE EXCEPTION 'Cannot modify created_at on reports';
  END IF;
  
  -- Allow only mutable fields: status, executive_md, technical_md, executive_json, technical_json, updated_at
  RETURN NEW;
END;
$function$;

-- Create trigger
DROP TRIGGER IF EXISTS prevent_report_immutable_changes ON public.reports;
CREATE TRIGGER prevent_report_immutable_changes
  BEFORE UPDATE ON public.reports
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_report_immutable_changes();

-- B) Drop existing UPDATE policy and recreate with explicit WITH CHECK
DROP POLICY IF EXISTS "Creators and admins can update reports" ON public.reports;

CREATE POLICY "Creators and admins can update reports with validation"
  ON public.reports
  FOR UPDATE
  USING (
    has_org_access(auth.uid(), organization_id) 
    AND (created_by = auth.uid() OR has_role(auth.uid(), organization_id, 'admin'::app_role))
  )
  WITH CHECK (
    has_org_access(auth.uid(), organization_id) 
    AND (created_by = auth.uid() OR has_role(auth.uid(), organization_id, 'admin'::app_role))
  );