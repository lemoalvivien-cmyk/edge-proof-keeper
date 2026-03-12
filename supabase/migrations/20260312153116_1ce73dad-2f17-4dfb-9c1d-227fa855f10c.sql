
-- ── Harden user_roles INSERT policy for bootstrap ─────────────────────────────
--
-- PROBLEM: Current policy requires has_role(admin) to insert any role.
-- During bootstrap, the user just created the org (no roles yet) so
-- has_role returns FALSE → INSERT is blocked → bootstrap fails at step 4.
--
-- SOLUTION: Add a complementary bootstrap policy that allows a user to
-- assign themselves ONLY the 'admin' role in an org where they have NO role yet
-- AND they are the sole owner (no other roles exist for that org yet).
--
-- This is a strictly scoped bootstrap window:
--   - Only for the calling user themselves (user_id = auth.uid())
--   - Only 'admin' role
--   - Only if caller has 0 roles in that org
--   - Only if the org has 0 total roles (brand new org)
-- ─────────────────────────────────────────────────────────────────────────────

-- Drop old policy that blocks bootstrap
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;

-- Recreate admin management policy (unchanged for day-to-day admin use)
CREATE POLICY "Admins can insert roles for others"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), organization_id, 'admin'::app_role)
);

-- Bootstrap policy: first owner of a brand-new org can assign themselves admin
-- Conditions (all must be true):
--   1. Inserting for yourself only
--   2. Role being inserted is 'admin'
--   3. You have no roles in this org yet
--   4. The org has no roles at all (ensures only the first claim)
CREATE POLICY "Bootstrap: first owner can self-assign admin in empty org"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND role = 'admin'::app_role
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur2
    WHERE ur2.user_id = auth.uid()
      AND ur2.organization_id = user_roles.organization_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur3
    WHERE ur3.organization_id = user_roles.organization_id
  )
);
