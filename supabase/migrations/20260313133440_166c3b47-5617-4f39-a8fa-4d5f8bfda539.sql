-- Fix critical privilege escalation: bootstrap INSERT policy on user_roles
-- The existing policy allows any authenticated user without ANY role in the system
-- to assign themselves admin to any empty org. We close this by:
-- 1. Dropping the permissive bootstrap policy
-- 2. Removing the bootstrap INSERT policy entirely (initial admin assignment
--    is performed server-side by the bootstrap-owner edge function using service role)

-- Drop the vulnerable bootstrap policy
DROP POLICY IF EXISTS "Bootstrap: first owner can self-assign admin in empty org" ON public.user_roles;

-- Ensure INSERT on user_roles is only possible via service role (edge function)
-- No authenticated client-side INSERT should be allowed at all
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;
DROP POLICY IF EXISTS "Allow bootstrap role assignment" ON public.user_roles;

-- Keep only the read policy for authenticated users (to check their own role)
-- Admins can manage roles via edge functions using service role key
