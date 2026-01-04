-- =============================================
-- A1) Create proof_packs table
-- =============================================
CREATE TABLE public.proof_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  scope text,
  tool_run_id uuid REFERENCES public.tool_runs(id),
  report_id uuid REFERENCES public.reports(id),
  status text NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'failed')),
  pack_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  pack_hash text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_proof_packs_org_created ON public.proof_packs(organization_id, created_at DESC);
CREATE INDEX idx_proof_packs_tool_run ON public.proof_packs(tool_run_id) WHERE tool_run_id IS NOT NULL;
CREATE INDEX idx_proof_packs_report ON public.proof_packs(report_id) WHERE report_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.proof_packs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Org members can view proof packs"
  ON public.proof_packs FOR SELECT
  USING (has_org_access(auth.uid(), organization_id));

CREATE POLICY "Org members can create proof packs"
  ON public.proof_packs FOR INSERT
  WITH CHECK (has_org_access(auth.uid(), organization_id) AND created_by = auth.uid());

CREATE POLICY "Creators and admins can update proof packs"
  ON public.proof_packs FOR UPDATE
  USING (has_org_access(auth.uid(), organization_id) AND (created_by = auth.uid() OR has_role(auth.uid(), organization_id, 'admin')))
  WITH CHECK (has_org_access(auth.uid(), organization_id) AND (created_by = auth.uid() OR has_role(auth.uid(), organization_id, 'admin')));

-- Trigger to prevent immutable field changes
CREATE OR REPLACE FUNCTION public.prevent_proof_pack_immutable_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.organization_id IS DISTINCT FROM NEW.organization_id THEN
    RAISE EXCEPTION 'Cannot modify organization_id on proof_packs';
  END IF;
  IF OLD.tool_run_id IS DISTINCT FROM NEW.tool_run_id THEN
    RAISE EXCEPTION 'Cannot modify tool_run_id on proof_packs';
  END IF;
  IF OLD.report_id IS DISTINCT FROM NEW.report_id THEN
    RAISE EXCEPTION 'Cannot modify report_id on proof_packs';
  END IF;
  IF OLD.created_by IS DISTINCT FROM NEW.created_by THEN
    RAISE EXCEPTION 'Cannot modify created_by on proof_packs';
  END IF;
  IF OLD.created_at IS DISTINCT FROM NEW.created_at THEN
    RAISE EXCEPTION 'Cannot modify created_at on proof_packs';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER prevent_proof_pack_immutable_changes
  BEFORE UPDATE ON public.proof_packs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_proof_pack_immutable_changes();

-- =============================================
-- A2) Create verify_evidence_chain function
-- =============================================
CREATE OR REPLACE FUNCTION public.verify_evidence_chain(_org_id uuid)
RETURNS TABLE (
  is_valid boolean,
  last_seq bigint,
  head_hash text,
  first_bad_seq bigint,
  expected_hash text,
  found_hash text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row RECORD;
  v_prev_hash text := 'GENESIS';
  v_computed_hash text;
  v_payload text;
  v_last_seq bigint := 0;
  v_head_hash text := 'GENESIS';
  v_is_valid boolean := true;
  v_first_bad_seq bigint := NULL;
  v_expected_hash text := NULL;
  v_found_hash text := NULL;
BEGIN
  -- Iterate through evidence log in sequence order
  FOR v_row IN 
    SELECT * FROM public.evidence_log 
    WHERE organization_id = _org_id 
    ORDER BY seq ASC
  LOOP
    -- Build payload exactly as in compute_evidence_hash_chain
    v_payload := concat_ws('|',
      v_row.organization_id::text,
      v_row.seq::text,
      COALESCE(v_row.user_id::text, ''),
      v_row.action,
      v_row.entity_type,
      COALESCE(v_row.entity_id::text, ''),
      COALESCE(v_row.artifact_hash, ''),
      COALESCE(v_row.ip_address, ''),
      v_row.created_at::text,
      v_prev_hash
    );
    
    -- Compute expected hash
    v_computed_hash := sha256_hex(v_payload);
    
    -- Check prev_hash matches our running hash
    IF v_row.prev_hash IS DISTINCT FROM v_prev_hash THEN
      IF v_is_valid THEN
        v_is_valid := false;
        v_first_bad_seq := v_row.seq;
        v_expected_hash := v_prev_hash;
        v_found_hash := v_row.prev_hash;
      END IF;
    END IF;
    
    -- Check entry_hash matches computed
    IF v_row.entry_hash IS DISTINCT FROM v_computed_hash THEN
      IF v_is_valid THEN
        v_is_valid := false;
        v_first_bad_seq := v_row.seq;
        v_expected_hash := v_computed_hash;
        v_found_hash := v_row.entry_hash;
      END IF;
    END IF;
    
    -- Update running state
    v_prev_hash := v_row.entry_hash;
    v_last_seq := v_row.seq;
    v_head_hash := v_row.entry_hash;
  END LOOP;
  
  -- Return results
  RETURN QUERY SELECT v_is_valid, v_last_seq, v_head_hash, v_first_bad_seq, v_expected_hash, v_found_hash;
END;
$$;