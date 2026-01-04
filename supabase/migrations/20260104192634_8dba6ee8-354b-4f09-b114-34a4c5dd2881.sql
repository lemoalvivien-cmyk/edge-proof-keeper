-- =============================================
-- SENTINEL EDGE - Complete Database Schema
-- Multi-tenant cybersecurity governance platform
-- =============================================

-- 1. Create custom types/enums
CREATE TYPE public.app_role AS ENUM ('admin', 'auditor', 'user');
CREATE TYPE public.authorization_status AS ENUM ('pending', 'approved', 'expired', 'revoked');
CREATE TYPE public.scan_type AS ENUM ('vulnerability', 'asset_discovery', 'document_import', 'compliance_check');
CREATE TYPE public.compliance_framework AS ENUM ('gdpr', 'nis2');
CREATE TYPE public.control_status AS ENUM ('not_started', 'in_progress', 'implemented', 'not_applicable');
CREATE TYPE public.risk_level AS ENUM ('critical', 'high', 'medium', 'low', 'info');

-- 2. Organizations table (multi-tenant root)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. User roles table (separate from profiles for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id, role)
);

-- 5. Authorizations table (legal proof storage)
CREATE TABLE public.authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_url TEXT NOT NULL,
  document_hash TEXT NOT NULL,
  consent_checkbox BOOLEAN NOT NULL DEFAULT false,
  consent_ip TEXT NOT NULL,
  consent_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  scope TEXT NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  status public.authorization_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Assets table (authorized systems/networks)
CREATE TABLE public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  authorization_id UUID REFERENCES public.authorizations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  asset_type TEXT NOT NULL,
  identifier TEXT,
  description TEXT,
  risk_level public.risk_level DEFAULT 'medium',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Scans table (scan results)
CREATE TABLE public.scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  authorization_id UUID NOT NULL REFERENCES public.authorizations(id) ON DELETE RESTRICT,
  asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
  scan_type public.scan_type NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  findings_count INTEGER DEFAULT 0,
  critical_count INTEGER DEFAULT 0,
  high_count INTEGER DEFAULT 0,
  medium_count INTEGER DEFAULT 0,
  low_count INTEGER DEFAULT 0,
  raw_data JSONB,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Documents table (compliance documents)
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  authorization_id UUID REFERENCES public.authorizations(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_hash TEXT NOT NULL,
  framework public.compliance_framework,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Evidence log (APPEND-ONLY audit trail)
CREATE TABLE public.evidence_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  artifact_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Compliance controls (GDPR/NIS2 requirements)
CREATE TABLE public.compliance_controls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  framework public.compliance_framework NOT NULL,
  control_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(framework, control_id)
);

-- 11. Control mappings (org-specific control status)
CREATE TABLE public.control_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  control_id UUID NOT NULL REFERENCES public.compliance_controls(id) ON DELETE CASCADE,
  status public.control_status NOT NULL DEFAULT 'not_started',
  evidence_notes TEXT,
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, control_id)
);

-- 12. Secrets vault (BYOK - metadata only, actual secrets via edge functions)
CREATE TABLE public.secrets_vault (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  key_name TEXT NOT NULL,
  key_type TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, key_name)
);

-- =============================================
-- SECURITY DEFINER FUNCTIONS (bypass RLS safely)
-- =============================================

-- Function to check if user has a specific role in an organization
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _org_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND role = _role
  )
$$;

-- Function to check if user has ANY role in an organization
CREATE OR REPLACE FUNCTION public.has_org_access(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND organization_id = _org_id
  )
$$;

-- Function to get user's organization ID
CREATE OR REPLACE FUNCTION public.get_user_org_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1
$$;

-- Function to check if user has valid authorization for operations
CREATE OR REPLACE FUNCTION public.has_valid_authorization(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.authorizations
    WHERE organization_id = _org_id
      AND status = 'approved'
      AND consent_checkbox = true
      AND (valid_until IS NULL OR valid_until > now())
  )
$$;

-- =============================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =============================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_controls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.control_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secrets_vault ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- ORGANIZATIONS: Users can view their own org
CREATE POLICY "Users can view their organization"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (public.has_org_access(auth.uid(), id));

-- PROFILES: Users can view/update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

-- USER_ROLES: Only admins can manage, users can view
CREATE POLICY "Users can view roles in their org"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_org_access(auth.uid(), organization_id));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), organization_id, 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), organization_id, 'admin'));

-- AUTHORIZATIONS: Org members can view, admins/users can create
CREATE POLICY "Org members can view authorizations"
  ON public.authorizations FOR SELECT
  TO authenticated
  USING (public.has_org_access(auth.uid(), organization_id));

CREATE POLICY "Org members can create authorizations"
  ON public.authorizations FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_org_access(auth.uid(), organization_id) 
    AND created_by = auth.uid()
  );

CREATE POLICY "Admins can update authorizations"
  ON public.authorizations FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), organization_id, 'admin'));

-- ASSETS: Org members can view/create, only if authorized
CREATE POLICY "Org members can view assets"
  ON public.assets FOR SELECT
  TO authenticated
  USING (public.has_org_access(auth.uid(), organization_id));

CREATE POLICY "Org members can create assets"
  ON public.assets FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_org_access(auth.uid(), organization_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "Asset creators and admins can update"
  ON public.assets FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid() 
    OR public.has_role(auth.uid(), organization_id, 'admin')
  );

-- SCANS: Require valid authorization + org access
CREATE POLICY "Org members can view scans"
  ON public.scans FOR SELECT
  TO authenticated
  USING (public.has_org_access(auth.uid(), organization_id));

CREATE POLICY "Org members can create scans with authorization"
  ON public.scans FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_org_access(auth.uid(), organization_id)
    AND public.has_valid_authorization(auth.uid(), organization_id)
    AND created_by = auth.uid()
  );

-- DOCUMENTS: Org access required
CREATE POLICY "Org members can view documents"
  ON public.documents FOR SELECT
  TO authenticated
  USING (public.has_org_access(auth.uid(), organization_id));

CREATE POLICY "Org members can create documents"
  ON public.documents FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_org_access(auth.uid(), organization_id)
    AND created_by = auth.uid()
  );

-- EVIDENCE_LOG: APPEND-ONLY (no update/delete policies)
CREATE POLICY "Org members can view evidence"
  ON public.evidence_log FOR SELECT
  TO authenticated
  USING (public.has_org_access(auth.uid(), organization_id));

CREATE POLICY "Org members can insert evidence"
  ON public.evidence_log FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_org_access(auth.uid(), organization_id)
    AND (user_id IS NULL OR user_id = auth.uid())
  );
-- NO UPDATE OR DELETE POLICIES - Evidence is immutable

-- COMPLIANCE_CONTROLS: Public read (framework definitions)
CREATE POLICY "Anyone can view compliance controls"
  ON public.compliance_controls FOR SELECT
  TO authenticated
  USING (true);

-- CONTROL_MAPPINGS: Org-specific
CREATE POLICY "Org members can view control mappings"
  ON public.control_mappings FOR SELECT
  TO authenticated
  USING (public.has_org_access(auth.uid(), organization_id));

CREATE POLICY "Org members can manage control mappings"
  ON public.control_mappings FOR INSERT
  TO authenticated
  WITH CHECK (public.has_org_access(auth.uid(), organization_id));

CREATE POLICY "Org members can update control mappings"
  ON public.control_mappings FOR UPDATE
  TO authenticated
  USING (public.has_org_access(auth.uid(), organization_id));

-- SECRETS_VAULT: Admin only
CREATE POLICY "Admins can view secrets metadata"
  ON public.secrets_vault FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), organization_id, 'admin'));

CREATE POLICY "Admins can manage secrets"
  ON public.secrets_vault FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), organization_id, 'admin')
    AND created_by = auth.uid()
  );

CREATE POLICY "Admins can update secrets"
  ON public.secrets_vault FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), organization_id, 'admin'));

CREATE POLICY "Admins can delete secrets"
  ON public.secrets_vault FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), organization_id, 'admin'));

-- =============================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_control_mappings_updated_at
  BEFORE UPDATE ON public.control_mappings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_secrets_vault_updated_at
  BEFORE UPDATE ON public.secrets_vault
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- SEED COMPLIANCE CONTROLS (GDPR + NIS2)
-- =============================================

-- GDPR Controls
INSERT INTO public.compliance_controls (framework, control_id, title, description, category) VALUES
('gdpr', 'GDPR-5', 'Principles of data processing', 'Lawfulness, fairness, transparency, purpose limitation, data minimisation, accuracy, storage limitation, integrity, confidentiality', 'Principles'),
('gdpr', 'GDPR-6', 'Lawful basis for processing', 'Consent, contract, legal obligation, vital interests, public task, legitimate interests', 'Legal Basis'),
('gdpr', 'GDPR-7', 'Conditions for consent', 'Demonstrable, distinguishable, withdrawable consent', 'Consent'),
('gdpr', 'GDPR-12', 'Transparent information', 'Information provided in concise, transparent, intelligible form', 'Transparency'),
('gdpr', 'GDPR-13', 'Information at collection', 'Identity, purposes, recipients, retention, rights information', 'Transparency'),
('gdpr', 'GDPR-15', 'Right of access', 'Data subject right to obtain confirmation and access to data', 'Data Subject Rights'),
('gdpr', 'GDPR-17', 'Right to erasure', 'Right to be forgotten under specific conditions', 'Data Subject Rights'),
('gdpr', 'GDPR-25', 'Data protection by design', 'Appropriate technical and organisational measures', 'Security'),
('gdpr', 'GDPR-30', 'Records of processing', 'Maintain records of processing activities', 'Documentation'),
('gdpr', 'GDPR-32', 'Security of processing', 'Appropriate security measures including encryption', 'Security'),
('gdpr', 'GDPR-33', 'Breach notification to authority', 'Notify supervisory authority within 72 hours', 'Breach'),
('gdpr', 'GDPR-34', 'Breach notification to subjects', 'Communicate breach to data subjects when high risk', 'Breach'),
('gdpr', 'GDPR-35', 'Data protection impact assessment', 'DPIA for high-risk processing', 'Risk Assessment'),
('gdpr', 'GDPR-37', 'Data Protection Officer', 'Designate DPO when required', 'Governance');

-- NIS2 Controls
INSERT INTO public.compliance_controls (framework, control_id, title, description, category) VALUES
('nis2', 'NIS2-21.1', 'Risk analysis and policies', 'Policies on risk analysis and information system security', 'Governance'),
('nis2', 'NIS2-21.2', 'Incident handling', 'Incident handling procedures and response', 'Incident Response'),
('nis2', 'NIS2-21.3', 'Business continuity', 'Business continuity and crisis management', 'Resilience'),
('nis2', 'NIS2-21.4', 'Supply chain security', 'Security in acquisition, development and maintenance', 'Supply Chain'),
('nis2', 'NIS2-21.5', 'Network security', 'Security in network and information systems acquisition', 'Technical'),
('nis2', 'NIS2-21.6', 'Vulnerability management', 'Policies for vulnerability handling and disclosure', 'Technical'),
('nis2', 'NIS2-21.7', 'Effectiveness assessment', 'Policies to assess cybersecurity risk measures', 'Assessment'),
('nis2', 'NIS2-21.8', 'Cyber hygiene and training', 'Basic cyber hygiene practices and training', 'Awareness'),
('nis2', 'NIS2-21.9', 'Cryptography', 'Policies on use of cryptography and encryption', 'Technical'),
('nis2', 'NIS2-21.10', 'Human resources security', 'Human resources security and access control', 'Access Control'),
('nis2', 'NIS2-23', 'Incident reporting', 'Report significant incidents to authorities', 'Incident Response'),
('nis2', 'NIS2-24', 'Use of certification', 'Demonstrate compliance through certification', 'Compliance');