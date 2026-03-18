
-- Fix PUBLIC_DATA_EXPOSURE: Restrict organizations UPDATE policy to admin role only.
-- Previously any org member (has_org_access) could rename the org or swap permanent_authorization_id.
DROP POLICY IF EXISTS "Org members can update their organization" ON public.organizations;

CREATE POLICY "Admins can update their organization"
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), id, 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), id, 'admin'::app_role));
