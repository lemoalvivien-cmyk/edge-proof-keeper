-- Drop existing function first to change return type
DROP FUNCTION IF EXISTS public.verify_evidence_chain(uuid);

-- Recreate with robust version including legacy_rows_count
CREATE OR REPLACE FUNCTION public.verify_evidence_chain(_org_id uuid)
RETURNS TABLE (
  is_valid boolean,
  last_seq bigint,
  head_hash text,
  first_bad_seq bigint,
  expected_hash text,
  found_hash text,
  legacy_rows_count bigint
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
  v_expected_seq bigint := 1;
  v_legacy_count bigint := 0;
BEGIN
  -- Count legacy rows without seq
  SELECT count(*) INTO v_legacy_count
  FROM public.evidence_log
  WHERE organization_id = _org_id AND seq IS NULL;

  -- Iterate through chained entries only
  FOR v_row IN
    SELECT * FROM public.evidence_log
    WHERE organization_id = _org_id AND seq IS NOT NULL
    ORDER BY seq ASC
  LOOP
    -- Check gap / contiguity
    IF v_row.seq IS DISTINCT FROM v_expected_seq THEN
      RETURN QUERY SELECT false, v_last_seq, v_head_hash, v_expected_seq, 'EXPECTED_SEQ', COALESCE(v_row.seq::text,'NULL'), v_legacy_count;
      RETURN;
    END IF;

    -- Build payload exactly like compute_evidence_hash_chain
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

    v_computed_hash := public.sha256_hex(v_payload);

    -- prev_hash match
    IF v_row.prev_hash IS DISTINCT FROM v_prev_hash THEN
      RETURN QUERY SELECT false, v_row.seq, v_head_hash, v_row.seq, v_prev_hash, v_row.prev_hash, v_legacy_count;
      RETURN;
    END IF;

    -- entry_hash match
    IF v_row.entry_hash IS DISTINCT FROM v_computed_hash THEN
      RETURN QUERY SELECT false, v_row.seq, v_head_hash, v_row.seq, v_computed_hash, v_row.entry_hash, v_legacy_count;
      RETURN;
    END IF;

    v_prev_hash := v_row.entry_hash;
    v_last_seq := v_row.seq;
    v_head_hash := v_row.entry_hash;
    v_expected_seq := v_expected_seq + 1;
  END LOOP;

  RETURN QUERY SELECT true, v_last_seq, v_head_hash, NULL::bigint, NULL::text, NULL::text, v_legacy_count;
END;
$$;