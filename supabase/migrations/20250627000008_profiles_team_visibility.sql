-- Admin/Staff can view all profiles in their org (needed for Team Members / User Management).
-- Volunteers keep "view own profile only" via the existing policy.
CREATE POLICY "Admins and staff can view all profiles in their org" ON public.profiles FOR SELECT
TO authenticated
USING (org_id = public.current_user_org() AND public.current_user_role() IN ('Admin', 'Staff'));

-- Admins can update any profile in their org (needed to change roles, incl. promoting to Admin).
CREATE POLICY "Admins can update any profile in their org" ON public.profiles FOR UPDATE
TO authenticated
USING (org_id = public.current_user_org() AND public.current_user_role() = 'Admin')
WITH CHECK (org_id = public.current_user_org() AND public.current_user_role() = 'Admin');
