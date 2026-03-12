-- Add external sovereignty confirmation timestamp to app_runtime_config
ALTER TABLE public.app_runtime_config
  ADD COLUMN IF NOT EXISTS external_sovereign_confirmed_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;