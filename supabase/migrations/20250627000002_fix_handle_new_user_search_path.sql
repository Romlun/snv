CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    first_user_role public.user_role := 'Staff';
    default_org_id UUID := public.get_default_org_id();
BEGIN
    IF (SELECT count(*) FROM public.profiles) = 0 THEN
        first_user_role := 'Admin';
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role, org_id)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', first_user_role, default_org_id);
    RETURN new;
END;
$$;
