
-- ══════════════════════════════════════════════════════════════════════════════
-- MIGRATION: Access Codes System
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. CREATE access_codes TABLE
CREATE TABLE public.access_codes (
  id                uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code_hash         text        NOT NULL UNIQUE,
  code_label        text        NULL,
  grant_plan        text        NOT NULL DEFAULT 'pro',
  grant_days        integer     NOT NULL DEFAULT 365,
  max_redemptions   integer     NOT NULL DEFAULT 1,
  redemptions_count integer     NOT NULL DEFAULT 0,
  is_active         boolean     NOT NULL DEFAULT true,
  created_by        uuid        NULL,
  redeemed_by       uuid        NULL,
  redeemed_at       timestamptz NULL,
  valid_from        timestamptz NOT NULL DEFAULT now(),
  valid_until       timestamptz NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_access_codes_code_hash   ON public.access_codes (code_hash);
CREATE INDEX idx_access_codes_is_active   ON public.access_codes (is_active);
CREATE INDEX idx_access_codes_redeemed_by ON public.access_codes (redeemed_by);

CREATE TRIGGER trg_access_codes_updated_at
  BEFORE UPDATE ON public.access_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view access codes"
  ON public.access_codes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

CREATE POLICY "Admins can update access codes"
  ON public.access_codes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

-- 2. ADD promo columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS access_grant_source text        NULL,
  ADD COLUMN IF NOT EXISTS access_code_id      uuid        NULL REFERENCES public.access_codes(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS access_grant_end    timestamptz NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_access_code_id ON public.profiles (access_code_id);

-- 3. UPDATE has_active_subscription to include 'granted'
CREATE OR REPLACE FUNCTION public.has_active_subscription(_user_id uuid)
  RETURNS boolean
  LANGUAGE sql
  STABLE SECURITY DEFINER
  SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND subscription_status IN ('active', 'trialing', 'granted')
      AND (subscription_end IS NULL OR subscription_end > now())
  )
$$;

-- 4. HARDEN profiles UPDATE policy
DO $$
BEGIN
  DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
  DROP POLICY IF EXISTS "Profiles are updatable by users who created them." ON public.profiles;
END $$;

CREATE POLICY "Users can update safe profile fields"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. CREATE access_code_events audit table
CREATE TABLE IF NOT EXISTS public.access_code_events (
  id             uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        uuid        NULL,
  access_code_id uuid        NULL REFERENCES public.access_codes(id) ON DELETE SET NULL,
  code_label     text        NULL,
  event_type     text        NOT NULL,
  plan_granted   text        NULL,
  access_until   timestamptz NULL,
  ip_address     text        NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_access_code_events_user_id    ON public.access_code_events (user_id);
CREATE INDEX idx_access_code_events_code_id    ON public.access_code_events (access_code_id);
CREATE INDEX idx_access_code_events_created_at ON public.access_code_events (created_at DESC);

ALTER TABLE public.access_code_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view access code events"
  ON public.access_code_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )
  );

CREATE POLICY "Users can view their own access code events"
  ON public.access_code_events FOR SELECT
  USING (user_id = auth.uid());
