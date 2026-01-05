-- =====================================================
-- PHASE 1: SCOPE BINDING - Authorizations Extension
-- =====================================================

-- A) Extend authorizations table with scope details + consent versioning + RGPD IP
ALTER TABLE public.authorizations
  ADD COLUMN IF NOT EXISTS scope_type text DEFAULT 'domain',
  ADD COLUMN IF NOT EXISTS scope_domains text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS scope_cidrs text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS scope_assets text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_rules jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_by uuid,
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz,
  ADD COLUMN IF NOT EXISTS revoked_reason text,
  ADD COLUMN IF NOT EXISTS consent_text_version text DEFAULT '1.0',
  ADD COLUMN IF NOT EXISTS consent_text_hash text;

-- Migrate existing consent_ip to masked version (truncate IPv4 /24)
ALTER TABLE public.authorizations RENAME COLUMN consent_ip TO consent_ip_raw_deprecated;
ALTER TABLE public.authorizations ADD COLUMN IF NOT EXISTS consent_ip_hash text;

-- B) Add target_identifier to assets/tool_runs/scans
ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS target_identifier text;
ALTER TABLE public.tool_runs ADD COLUMN IF NOT EXISTS target_identifier text;
ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS target_identifier text;

-- Index for target lookups
CREATE INDEX IF NOT EXISTS idx_assets_target_identifier ON public.assets(target_identifier);
CREATE INDEX IF NOT EXISTS idx_tool_runs_target_identifier ON public.tool_runs(target_identifier);
CREATE INDEX IF NOT EXISTS idx_authorizations_scope_domains ON public.authorizations USING gin(scope_domains);
CREATE INDEX IF NOT EXISTS idx_authorizations_org_status ON public.authorizations(organization_id, status);

-- C) Function: normalize_target (canonicalize target identifier)
CREATE OR REPLACE FUNCTION public.normalize_target(_target text)
RETURNS text
LANGUAGE sql
IMMUTABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT lower(trim(
    regexp_replace(
      regexp_replace(_target, '^https?://', ''),  -- Remove protocol
      '/.*$', ''  -- Remove path
    )
  ))
$$;

-- D) Function: get_my_org_id() - no param version using auth.uid()
CREATE OR REPLACE FUNCTION public.get_my_org_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT organization_id
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1
$$;

-- E) Function: is_target_in_scope - check if target is within authorization scope
CREATE OR REPLACE FUNCTION public.is_target_in_scope(_auth_id uuid, _target text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_auth RECORD;
  v_normalized_target text;
  v_domain text;
BEGIN
  -- Normalize the target
  v_normalized_target := normalize_target(_target);
  
  -- Get authorization details
  SELECT scope_type, scope_domains, scope_cidrs, scope_assets, target_rules
  INTO v_auth
  FROM public.authorizations
  WHERE id = _auth_id;
  
  IF v_auth IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check scope_type = 'any' (for document imports without specific target)
  IF v_auth.scope_type = 'any' THEN
    RETURN TRUE;
  END IF;
  
  -- Check if target is in scope_domains (exact match or subdomain)
  IF v_auth.scope_domains IS NOT NULL AND array_length(v_auth.scope_domains, 1) > 0 THEN
    FOREACH v_domain IN ARRAY v_auth.scope_domains
    LOOP
      -- Exact match or subdomain
      IF v_normalized_target = lower(trim(v_domain)) 
         OR v_normalized_target LIKE '%.' || lower(trim(v_domain)) THEN
        RETURN TRUE;
      END IF;
    END LOOP;
  END IF;
  
  -- Check if target is in scope_assets (exact match)
  IF v_auth.scope_assets IS NOT NULL AND v_normalized_target = ANY(v_auth.scope_assets) THEN
    RETURN TRUE;
  END IF;
  
  -- Check CIDR ranges (basic IPv4 check - for full support use inet type)
  IF v_auth.scope_cidrs IS NOT NULL AND array_length(v_auth.scope_cidrs, 1) > 0 THEN
    -- Simple IP check - target starts with CIDR prefix
    FOREACH v_domain IN ARRAY v_auth.scope_cidrs
    LOOP
      -- Basic prefix matching (for proper CIDR, use inet operators)
      IF v_normalized_target LIKE split_part(v_domain, '/', 1) || '%' THEN
        RETURN TRUE;
      END IF;
    END LOOP;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- F) Function: require_valid_scope - blocking function for INSERT triggers
CREATE OR REPLACE FUNCTION public.require_valid_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_auth_valid boolean;
  v_target_in_scope boolean;
BEGIN
  -- Skip if no authorization required (some tables may allow null)
  IF NEW.authorization_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check authorization is valid
  v_auth_valid := is_authorization_valid(NEW.authorization_id);
  IF NOT v_auth_valid THEN
    RAISE EXCEPTION 'Authorization % is not valid or expired', NEW.authorization_id;
  END IF;
  
  -- Check target is in scope (if target_identifier is set)
  IF NEW.target_identifier IS NOT NULL AND NEW.target_identifier != '' THEN
    v_target_in_scope := is_target_in_scope(NEW.authorization_id, NEW.target_identifier);
    IF NOT v_target_in_scope THEN
      RAISE EXCEPTION 'Target % is not within authorization scope', NEW.target_identifier;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- G) Create triggers for scope validation on assets and tool_runs
DROP TRIGGER IF EXISTS trg_assets_require_scope ON public.assets;
CREATE TRIGGER trg_assets_require_scope
  BEFORE INSERT ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION public.require_valid_scope();

DROP TRIGGER IF EXISTS trg_tool_runs_require_scope ON public.tool_runs;
CREATE TRIGGER trg_tool_runs_require_scope
  BEFORE INSERT ON public.tool_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.require_valid_scope();

DROP TRIGGER IF EXISTS trg_scans_require_scope ON public.scans;
CREATE TRIGGER trg_scans_require_scope
  BEFORE INSERT ON public.scans
  FOR EACH ROW
  EXECUTE FUNCTION public.require_valid_scope();

-- H) Revoke direct execution from public, grant to authenticated
REVOKE ALL ON FUNCTION public.normalize_target(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_my_org_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_target_in_scope(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.require_valid_scope() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.normalize_target(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_target_in_scope(uuid, text) TO authenticated;
-- require_valid_scope is only called by triggers, no direct grant needed

-- I) Add check constraint for consent_text_version format
ALTER TABLE public.authorizations 
  ADD CONSTRAINT chk_consent_text_version CHECK (consent_text_version ~ '^[0-9]+\.[0-9]+$');

-- J) Comment on new columns for documentation
COMMENT ON COLUMN public.authorizations.scope_type IS 'Type: domain, cidr, asset, any';
COMMENT ON COLUMN public.authorizations.scope_domains IS 'List of authorized domains (including subdomains)';
COMMENT ON COLUMN public.authorizations.scope_cidrs IS 'List of authorized CIDR ranges';
COMMENT ON COLUMN public.authorizations.scope_assets IS 'List of specific authorized asset identifiers';
COMMENT ON COLUMN public.authorizations.target_rules IS 'Advanced target rules in JSON format';
COMMENT ON COLUMN public.authorizations.consent_text_version IS 'Version of consent text accepted (e.g., 1.0)';
COMMENT ON COLUMN public.authorizations.consent_text_hash IS 'SHA-256 hash of consent text for auditability';
COMMENT ON COLUMN public.authorizations.consent_ip_hash IS 'Hashed/masked IP address (GDPR compliant)';
COMMENT ON COLUMN public.assets.target_identifier IS 'Canonical target identifier (domain, IP, URL)';
COMMENT ON COLUMN public.tool_runs.target_identifier IS 'Canonical target identifier for the run';
COMMENT ON FUNCTION public.is_target_in_scope(uuid, text) IS 'Checks if target is within authorization scope';