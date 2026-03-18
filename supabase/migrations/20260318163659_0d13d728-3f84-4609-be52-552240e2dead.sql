-- ============================================================
-- SPRINT 1 — Rate Limiting réel (DB-backed)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.rate_limits (
  user_id       text        NOT NULL,
  function_name text        NOT NULL,
  window_start  timestamptz NOT NULL DEFAULT now(),
  request_count int         NOT NULL DEFAULT 1,
  PRIMARY KEY (user_id, function_name)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Aucune politique client — accès uniquement par service_role

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_user_id      text,
  p_function_name text,
  p_max_per_minute int DEFAULT 10
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_now         timestamptz := now();
  v_count        int;
BEGIN
  INSERT INTO public.rate_limits (user_id, function_name, window_start, request_count)
  VALUES (p_user_id, p_function_name, v_now, 1)
  ON CONFLICT (user_id, function_name) DO UPDATE
    SET
      window_start  = CASE
                        WHEN rate_limits.window_start < v_now - INTERVAL '1 minute'
                        THEN v_now
                        ELSE rate_limits.window_start
                      END,
      request_count = CASE
                        WHEN rate_limits.window_start < v_now - INTERVAL '1 minute'
                        THEN 1
                        ELSE rate_limits.request_count + 1
                      END
  RETURNING request_count INTO v_count;

  RETURN v_count <= p_max_per_minute;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_rate_limit(text, text, int) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(text, text, int) TO service_role;