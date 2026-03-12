
-- ── Harden organizations INSERT policy ────────────────────────────────────────
--
-- BEFORE: WITH CHECK (true) — any authenticated user can create an org.
--         Too permissive. Supabase linter warning. Real multi-tenant risk.
--
-- AFTER:  WITH CHECK (NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid()))
--
-- RATIONALE:
--   bootstrapOwner() flow:
--     1. User authenticates → user_roles has 0 rows for auth.uid()
--     2. NOT EXISTS = TRUE → INSERT into organizations allowed
--     3. bootstrapOwner assigns admin role → user_roles now has 1 row
--     4. Any subsequent org INSERT → NOT EXISTS = FALSE → BLOCKED
--
-- This is the minimum strict policy that:
--   - allows the legitimate bootstrap window (0 roles = new user)
--   - blocks any user who already belongs to an org from creating another
--   - requires no service-role bypass on the client side
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can create an organization" ON public.organizations;

-- Create the hardened bootstrap-only policy
CREATE POLICY "Bootstrap: no-role user can create first organization"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (
  NOT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
  )
);
