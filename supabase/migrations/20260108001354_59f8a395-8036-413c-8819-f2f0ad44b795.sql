-- Corriger les policies RLS restantes qui exigent encore une autorisation

-- SCANS - Supprimer l'ancienne policy et recréer sans vérification d'autorisation
DROP POLICY IF EXISTS "Org members can create scans with valid authorization" ON public.scans;

-- TOOL_RUNS - Supprimer l'ancienne policy INSERT et UPDATE
DROP POLICY IF EXISTS "Org members can create tool runs with valid authorization" ON public.tool_runs;
DROP POLICY IF EXISTS "Requesters and admins can update tool runs with validation" ON public.tool_runs;

-- Recréer la policy UPDATE sans vérification d'autorisation
CREATE POLICY "Requesters and admins can update tool runs"
ON public.tool_runs
FOR UPDATE
USING (
  has_org_access(auth.uid(), organization_id)
  AND (requested_by = auth.uid() OR has_role(auth.uid(), organization_id, 'admin'::app_role))
)
WITH CHECK (
  has_org_access(auth.uid(), organization_id)
  AND (requested_by = auth.uid() OR has_role(auth.uid(), organization_id, 'admin'::app_role))
);

-- ASSETS - Supprimer l'ancienne policy et recréer sans vérification d'autorisation
DROP POLICY IF EXISTS "Org members can create assets" ON public.assets;

CREATE POLICY "Org members can create assets"
ON public.assets
FOR INSERT
WITH CHECK (
  has_org_access(auth.uid(), organization_id)
  AND created_by = auth.uid()
);

-- DOCUMENTS - Supprimer l'ancienne policy et recréer sans vérification d'autorisation
DROP POLICY IF EXISTS "Org members can create documents" ON public.documents;

CREATE POLICY "Org members can create documents"
ON public.documents
FOR INSERT
WITH CHECK (
  has_org_access(auth.uid(), organization_id)
  AND created_by = auth.uid()
);