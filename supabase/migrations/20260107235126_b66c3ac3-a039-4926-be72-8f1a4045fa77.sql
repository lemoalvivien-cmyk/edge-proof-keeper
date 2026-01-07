-- A) Ajouter colonne permanent_authorization_id sur organizations
ALTER TABLE public.organizations
ADD COLUMN permanent_authorization_id uuid REFERENCES public.authorizations(id);

-- Fonction pour créer/récupérer l'autorisation permanente de l'owner
CREATE OR REPLACE FUNCTION public.ensure_permanent_authorization(_org_id uuid, _user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_perm_auth_id uuid;
  v_new_auth_id uuid;
  v_doc_hash text;
BEGIN
  -- Vérifier que l'utilisateur a accès à l'organisation
  IF NOT has_org_access(_user_id, _org_id) THEN
    RAISE EXCEPTION 'User does not have access to this organization';
  END IF;

  -- Récupérer l'authorization permanente existante
  SELECT permanent_authorization_id INTO v_perm_auth_id
  FROM public.organizations
  WHERE id = _org_id;
  
  -- Si elle existe déjà, la retourner
  IF v_perm_auth_id IS NOT NULL THEN
    RETURN v_perm_auth_id;
  END IF;
  
  -- Créer un hash stable pour le document système
  v_doc_hash := sha256_hex('OWNER_PERMANENT_AUTHORIZATION_' || _org_id::text);
  
  -- Créer une nouvelle autorisation permanente
  INSERT INTO public.authorizations (
    organization_id,
    created_by,
    document_url,
    document_hash,
    consent_checkbox,
    consent_ip_raw_deprecated,
    consent_ip_hash,
    consent_timestamp,
    consent_text_version,
    consent_text_hash,
    scope,
    scope_type,
    scope_domains,
    scope_cidrs,
    scope_assets,
    target_rules,
    valid_from,
    valid_until,
    status,
    approved_by,
    approved_at
  ) VALUES (
    _org_id,
    _user_id,
    'system://owner-permanent',
    v_doc_hash,
    true,
    'SYSTEM',
    sha256_hex('SYSTEM_OWNER_PERMANENT'),
    now(),
    '1.0-owner-permanent',
    sha256_hex('OWNER_PERMANENT_SELF_ATTESTATION'),
    'OWNER_PERMANENT / SELF-ATTESTATION - Autorisation automatique pour tests personnels',
    'any',
    ARRAY[]::text[],
    ARRAY[]::text[],
    ARRAY[]::text[],
    '{"type": "owner_permanent", "auto_created": true}'::jsonb,
    now(),
    NULL, -- Permanent, pas de date d'expiration
    'approved',
    _user_id,
    now()
  )
  RETURNING id INTO v_new_auth_id;
  
  -- Mettre à jour l'organisation avec l'ID de l'autorisation permanente
  UPDATE public.organizations
  SET permanent_authorization_id = v_new_auth_id
  WHERE id = _org_id;
  
  -- Logger dans evidence_log (via trigger, donc insertion directe avec service role context)
  -- Note: On ne peut pas insérer directement car RLS bloque, donc on fait ça via edge function
  
  RETURN v_new_auth_id;
END;
$$;

-- Fonction pour récupérer l'autorisation par défaut d'une organisation
CREATE OR REPLACE FUNCTION public.get_default_authorization_id(_org_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    -- D'abord l'autorisation permanente
    (SELECT permanent_authorization_id FROM public.organizations WHERE id = _org_id),
    -- Sinon la dernière autorisation valide
    (SELECT id FROM public.authorizations 
     WHERE organization_id = _org_id 
       AND status = 'approved' 
       AND consent_checkbox = true
       AND (valid_until IS NULL OR valid_until > now())
     ORDER BY created_at DESC
     LIMIT 1)
  )
$$;

-- Mettre à jour has_valid_authorization pour prendre en compte l'autorisation permanente
CREATE OR REPLACE FUNCTION public.has_valid_authorization(_user_id uuid, _org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    -- Vérifier si une autorisation permanente existe
    SELECT 1 FROM public.organizations WHERE id = _org_id AND permanent_authorization_id IS NOT NULL
  ) OR EXISTS (
    -- Ou s'il y a une autorisation classique valide
    SELECT 1
    FROM public.authorizations
    WHERE organization_id = _org_id
      AND status = 'approved'
      AND consent_checkbox = true
      AND (valid_until IS NULL OR valid_until > now())
  )
$$;