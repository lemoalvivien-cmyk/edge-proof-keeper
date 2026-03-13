
-- Fix data_sources SELECT and UPDATE policies to restrict to admins only
-- This protects the 'config' column which may contain API keys, tokens, and credentials

-- Drop the overly permissive member-level policies
DROP POLICY IF EXISTS "Org members can view data sources" ON public.data_sources;
DROP POLICY IF EXISTS "Org members can update data sources" ON public.data_sources;

-- Recreate SELECT restricted to admins only
CREATE POLICY "Admins can view data sources"
ON public.data_sources
FOR SELECT
TO public
USING (has_role(auth.uid(), organization_id, 'admin'::app_role));

-- Recreate UPDATE restricted to admins only
CREATE POLICY "Admins can update data sources"
ON public.data_sources
FOR UPDATE
TO public
USING (has_role(auth.uid(), organization_id, 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), organization_id, 'admin'::app_role));
