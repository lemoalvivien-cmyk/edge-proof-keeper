-- ============================================
-- STORAGE BUCKETS (private)
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('authorizations', 'authorizations', false, 10485760, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']),
  ('documents', 'documents', false, 10485760, ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']),
  ('artifacts', 'artifacts', false, 10485760, ARRAY['application/pdf', 'application/json', 'text/csv'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ============================================
-- STORAGE POLICIES - authorizations bucket
-- ============================================
CREATE POLICY "Org members can read authorization files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'authorizations' 
  AND has_org_access(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Org members can upload authorization files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'authorizations'
  AND has_org_access(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Org members can delete their authorization files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'authorizations'
  AND has_org_access(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- ============================================
-- STORAGE POLICIES - documents bucket
-- ============================================
CREATE POLICY "Org members can read document files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents'
  AND has_org_access(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Org members can upload document files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND has_org_access(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Org members can delete their document files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'documents'
  AND has_org_access(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- ============================================
-- STORAGE POLICIES - artifacts bucket
-- ============================================
CREATE POLICY "Org members can read artifact files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'artifacts'
  AND has_org_access(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Org members can upload artifact files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'artifacts'
  AND has_org_access(auth.uid(), (storage.foldername(name))[1]::uuid)
);

-- ============================================
-- PERFORMANCE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_authorizations_org_id ON public.authorizations(organization_id);
CREATE INDEX IF NOT EXISTS idx_authorizations_org_created ON public.authorizations(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_authorizations_org_status ON public.authorizations(organization_id, status);

CREATE INDEX IF NOT EXISTS idx_assets_org_id ON public.assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_assets_org_created ON public.assets(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scans_org_id ON public.scans(organization_id);
CREATE INDEX IF NOT EXISTS idx_scans_org_created ON public.scans(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_authorization_id ON public.scans(authorization_id);

CREATE INDEX IF NOT EXISTS idx_documents_org_id ON public.documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_documents_org_created ON public.documents(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_evidence_log_org_id ON public.evidence_log(organization_id);
CREATE INDEX IF NOT EXISTS idx_evidence_log_org_created ON public.evidence_log(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_control_mappings_org_id ON public.control_mappings(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_org_id ON public.user_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);

-- ============================================
-- HELPER FUNCTION: Check if a specific authorization is valid
-- ============================================
CREATE OR REPLACE FUNCTION public.is_authorization_valid(_auth_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.authorizations
    WHERE id = _auth_id
      AND status = 'approved'
      AND consent_checkbox = true
      AND (valid_until IS NULL OR valid_until > now())
  )
$$;

-- ============================================
-- HELPER FUNCTION: Check authorization belongs to org
-- ============================================
CREATE OR REPLACE FUNCTION public.authorization_belongs_to_org(_auth_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.authorizations
    WHERE id = _auth_id
      AND organization_id = _org_id
  )
$$;

-- ============================================
-- UPDATE RLS POLICIES - scans table (stricter)
-- ============================================
DROP POLICY IF EXISTS "Org members can create scans with authorization" ON public.scans;

CREATE POLICY "Org members can create scans with valid authorization"
ON public.scans
FOR INSERT
WITH CHECK (
  has_org_access(auth.uid(), organization_id)
  AND created_by = auth.uid()
  AND authorization_belongs_to_org(authorization_id, organization_id)
  AND is_authorization_valid(authorization_id)
);

-- ============================================
-- UPDATE RLS POLICIES - documents table (allow null auth or valid auth)
-- ============================================
DROP POLICY IF EXISTS "Org members can create documents" ON public.documents;

CREATE POLICY "Org members can create documents"
ON public.documents
FOR INSERT
WITH CHECK (
  has_org_access(auth.uid(), organization_id)
  AND created_by = auth.uid()
  AND (
    authorization_id IS NULL
    OR (
      authorization_belongs_to_org(authorization_id, organization_id)
      AND is_authorization_valid(authorization_id)
    )
  )
);

-- ============================================
-- UPDATE RLS POLICIES - assets table (allow null auth or valid auth)
-- ============================================
DROP POLICY IF EXISTS "Org members can create assets" ON public.assets;

CREATE POLICY "Org members can create assets"
ON public.assets
FOR INSERT
WITH CHECK (
  has_org_access(auth.uid(), organization_id)
  AND created_by = auth.uid()
  AND (
    authorization_id IS NULL
    OR (
      authorization_belongs_to_org(authorization_id, organization_id)
      AND is_authorization_valid(authorization_id)
    )
  )
);