-- A) Rendre authorization_id NULLABLE partout

-- 1) scans.authorization_id - supprimer la contrainte NOT NULL
ALTER TABLE public.scans ALTER COLUMN authorization_id DROP NOT NULL;

-- 2) tool_runs.authorization_id - supprimer la contrainte NOT NULL
ALTER TABLE public.tool_runs ALTER COLUMN authorization_id DROP NOT NULL;

-- Note: assets.authorization_id et documents.authorization_id sont déjà nullable selon le schéma

-- B) Supprimer le trigger de validation de scope qui bloque les opérations
DROP TRIGGER IF EXISTS validate_scan_scope ON public.scans;
DROP TRIGGER IF EXISTS validate_tool_run_scope ON public.tool_runs;

-- C) Mettre à jour les policies RLS pour ne plus exiger d'autorisation

-- SCANS - Recréer les policies INSERT sans vérification d'autorisation
DROP POLICY IF EXISTS "Users can insert scans with valid authorization" ON public.scans;
DROP POLICY IF EXISTS "Users can create scans for their org" ON public.scans;

CREATE POLICY "Users can create scans for their org"
ON public.scans
FOR INSERT
WITH CHECK (
  has_org_access(auth.uid(), organization_id)
  AND created_by = auth.uid()
);

-- TOOL_RUNS - Recréer les policies INSERT sans vérification d'autorisation
DROP POLICY IF EXISTS "Users can insert tool_runs with valid authorization" ON public.tool_runs;
DROP POLICY IF EXISTS "Users can create tool_runs for their org" ON public.tool_runs;

CREATE POLICY "Users can create tool_runs for their org"
ON public.tool_runs
FOR INSERT
WITH CHECK (
  has_org_access(auth.uid(), organization_id)
  AND requested_by = auth.uid()
);

-- ASSETS - Vérifier et mettre à jour les policies
DROP POLICY IF EXISTS "Users can insert assets with valid authorization" ON public.assets;
DROP POLICY IF EXISTS "Users can create assets for their org" ON public.assets;

CREATE POLICY "Users can create assets for their org"
ON public.assets
FOR INSERT
WITH CHECK (
  has_org_access(auth.uid(), organization_id)
  AND created_by = auth.uid()
);

-- DOCUMENTS - Vérifier et mettre à jour les policies
DROP POLICY IF EXISTS "Users can insert documents with valid authorization" ON public.documents;
DROP POLICY IF EXISTS "Users can create documents for their org" ON public.documents;

CREATE POLICY "Users can create documents for their org"
ON public.documents
FOR INSERT
WITH CHECK (
  has_org_access(auth.uid(), organization_id)
  AND created_by = auth.uid()
);