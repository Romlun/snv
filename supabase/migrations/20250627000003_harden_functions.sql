-- get_default_org_id: pin search_path (keep IMMUTABLE, it returns a constant)
CREATE OR REPLACE FUNCTION public.get_default_org_id()
RETURNS UUID
LANGUAGE plpgsql
IMMUTABLE
SET search_path = ''
AS $$
BEGIN
    RETURN '018f3a3a-3c3c-7000-a5a5-4e4e4e4e4e4e'::UUID;
END;
$$;

-- current_user_role: pin search_path, schema-qualify
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$ SELECT role FROM public.profiles WHERE id = auth.uid() $$;

-- current_user_org: pin search_path, schema-qualify
CREATE OR REPLACE FUNCTION public.current_user_org()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$ SELECT org_id FROM public.profiles WHERE id = auth.uid() $$;

-- Lock down execution: revoke from anon (and public), grant only to authenticated.
-- These are used inside RLS policies, which run as the querying role, so
-- authenticated users must retain EXECUTE.
REVOKE EXECUTE ON FUNCTION public.current_user_role() FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.current_user_org() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_org() TO authenticated;

-- handle_new_user already has search_path set (migration 0002). It runs as the
-- auth system trigger, not via REST; revoke direct REST execute from anon/public.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public;
