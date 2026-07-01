-- Admins can view all profiles in their org (needed for Team Members / User Management).
-- Staff and Volunteers keep "view own profile only" via the existing policy —
-- full team visibility is Admin-only per operator decision (session 7).
CREATE POLICY "Admins can view all profiles in their org" ON public.profiles FOR SELECT
TO authenticated
USING (org_id = public.current_user_org() AND public.current_user_role() = 'Admin');

-- Admins can update any profile in their org (needed to change roles, incl. promoting to Admin).
CREATE POLICY "Admins can update any profile in their org" ON public.profiles FOR UPDATE
TO authenticated
USING (org_id = public.current_user_org() AND public.current_user_role() = 'Admin')
WITH CHECK (org_id = public.current_user_org() AND public.current_user_role() = 'Admin');
