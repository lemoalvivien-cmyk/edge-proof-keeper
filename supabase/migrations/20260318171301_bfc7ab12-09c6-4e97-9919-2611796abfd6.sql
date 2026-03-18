-- Sprint 4: Add sector and size columns to organizations for onboarding lead scoring
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS sector text,
  ADD COLUMN IF NOT EXISTS size text;