-- Allow authenticated users to create an organization (required for bootstrapOwner / first-run setup)
CREATE POLICY "Authenticated users can create an organization"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow org members to update their own organization
CREATE POLICY "Org members can update their organization"
ON public.organizations
FOR UPDATE
TO authenticated
USING (has_org_access(auth.uid(), id))
WITH CHECK (has_org_access(auth.uid(), id));