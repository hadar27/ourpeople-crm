-- Read actual authentication timestamps without exposing auth.users to clients.
-- Preserve the staff directory's own-row / administrator visibility rules.
BEGIN;

CREATE OR REPLACE FUNCTION public.get_user_last_sign_ins()
RETURNS TABLE (user_id text, last_login timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT u.id::text, a.last_sign_in_at
  FROM public.users AS u
  JOIN auth.users AS a ON a.id::text = u.id::text
  WHERE auth.uid() IS NOT NULL
    AND (
      u.id::text = auth.uid()::text
      OR public.current_user_role() IN ('מנהלת העמותה', 'מנהל מערכת')
    );
$$;

REVOKE ALL ON FUNCTION public.get_user_last_sign_ins() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_last_sign_ins() TO authenticated;

COMMIT;
