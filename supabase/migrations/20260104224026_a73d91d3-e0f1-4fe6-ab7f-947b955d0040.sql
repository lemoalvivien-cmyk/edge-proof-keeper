-- A) evidence_chain_state: Add SELECT policy (org-scoped read-only)
CREATE POLICY "Org members can view chain state"
ON public.evidence_chain_state
FOR SELECT
USING (has_org_access(auth.uid(), organization_id));

-- B) proof_packs: Write-once "tamper-proof"

-- B1) Backfill pack_hash for any existing rows with NULL or empty
UPDATE public.proof_packs 
SET pack_hash = sha256_hex(pack_json::text) 
WHERE pack_hash IS NULL OR pack_hash = '';

-- B2) Make pack_hash NOT NULL
ALTER TABLE public.proof_packs 
ALTER COLUMN pack_hash SET NOT NULL;

-- B3) Add CHECK constraint for valid SHA-256 hex (64 lowercase hex chars)
ALTER TABLE public.proof_packs 
ADD CONSTRAINT proof_packs_pack_hash_sha256_check 
CHECK (pack_hash ~ '^[a-f0-9]{64}$');

-- B4) Trigger to compute pack_hash on INSERT if not provided
CREATE OR REPLACE FUNCTION public.compute_proof_pack_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Always compute hash from pack_json to ensure consistency
  NEW.pack_hash := sha256_hex(NEW.pack_json::text);
  RETURN NEW;
END;
$$;

CREATE TRIGGER compute_proof_pack_hash_trigger
BEFORE INSERT ON public.proof_packs
FOR EACH ROW
EXECUTE FUNCTION public.compute_proof_pack_hash();

-- B5) Replace current immutability trigger with total immutability (like evidence_log)
DROP TRIGGER IF EXISTS prevent_proof_pack_immutable_changes ON public.proof_packs;
DROP FUNCTION IF EXISTS public.prevent_proof_pack_immutable_changes();

CREATE OR REPLACE FUNCTION public.prevent_proof_pack_mutations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Proof packs are immutable - % operations are not allowed', TG_OP;
END;
$$;

CREATE TRIGGER prevent_proof_pack_mutations_trigger
BEFORE UPDATE OR DELETE ON public.proof_packs
FOR EACH ROW
EXECUTE FUNCTION public.prevent_proof_pack_mutations();

-- C) RLS proof_packs: Remove UPDATE policy (write-once means no updates)
DROP POLICY IF EXISTS "Creators and admins can update proof packs" ON public.proof_packs;