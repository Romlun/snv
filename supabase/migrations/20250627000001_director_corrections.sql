-- 1. ROLE RECONCILIATION (3-tier)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

ALTER TABLE public.profiles ALTER COLUMN role DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN role TYPE TEXT USING role::TEXT;
DROP TYPE public.user_role;
CREATE TYPE public.user_role AS ENUM ('Admin', 'Staff', 'Volunteer');
ALTER TABLE public.profiles ALTER COLUMN role TYPE public.user_role USING role::public.user_role;
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'Staff';

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    first_user_role user_role := 'Staff';
    default_org_id UUID := get_default_org_id();
BEGIN
    -- Check if this is the first user
    IF (SELECT count(*) FROM public.profiles) = 0 THEN
        first_user_role := 'Admin';
    END IF;

    INSERT INTO public.profiles (id, email, full_name, role, org_id)
    VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', first_user_role, default_org_id);
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. GIFTS TABLE (per-gift source of truth, future-capture ready)
CREATE TABLE public.gifts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT get_default_org_id(),
    donor_id UUID REFERENCES public.donors(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    gift_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_recurring BOOLEAN DEFAULT FALSE,
    cadence TEXT,
    method TEXT,
    external_source TEXT,
    external_transaction_id TEXT,
    idempotency_key TEXT UNIQUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE INDEX gifts_donor_id_idx ON public.gifts(donor_id);
CREATE INDEX gifts_gift_date_idx ON public.gifts(gift_date);

ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

-- 3. COMPLETE RLS (org-isolation + 3-tier roles)
CREATE FUNCTION public.current_user_role() RETURNS user_role LANGUAGE sql SECURITY DEFINER
STABLE AS $$ SELECT role FROM public.profiles WHERE id = auth.uid() $$;

CREATE FUNCTION public.current_user_org() RETURNS UUID LANGUAGE sql SECURITY DEFINER
STABLE AS $$ SELECT org_id FROM public.profiles WHERE id = auth.uid() $$;

DROP POLICY IF EXISTS "Users can view donors in their org" ON public.donors;
DROP POLICY IF EXISTS "Users can insert donors in their org" ON public.donors;
DROP POLICY IF EXISTS "Users can update donors in their org" ON public.donors;
DROP POLICY IF EXISTS "Users can view churches in their org" ON public.churches;
DROP POLICY IF EXISTS "Users can view projects in their org" ON public.projects;
DROP POLICY IF EXISTS "Users can view tasks in their org" ON public.tasks;
DROP POLICY IF EXISTS "Users can view contact logs in their org" ON public.contact_logs;

CREATE POLICY "Users can view churches in their org" ON public.churches FOR SELECT
USING (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));
CREATE POLICY "Admins and staff can insert churches in their org" ON public.churches FOR INSERT
WITH CHECK (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));
CREATE POLICY "Admins and staff can update churches in their org" ON public.churches FOR UPDATE
USING (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'))
WITH CHECK (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));
CREATE POLICY "Admins and staff can delete churches in their org" ON public.churches FOR DELETE
USING (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));

CREATE POLICY "Users can view donors in their org" ON public.donors FOR SELECT
USING (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));
CREATE POLICY "Users can insert donors in their org" ON public.donors FOR INSERT
WITH CHECK (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));
CREATE POLICY "Users can update donors in their org" ON public.donors FOR UPDATE
USING (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'))
WITH CHECK (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));
CREATE POLICY "Admins and staff can delete donors in their org" ON public.donors FOR DELETE
USING (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));

CREATE POLICY "Users can view projects in their org" ON public.projects FOR SELECT
USING (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));
CREATE POLICY "Admins and staff can insert projects in their org" ON public.projects FOR INSERT
WITH CHECK (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));
CREATE POLICY "Admins and staff can update projects in their org" ON public.projects FOR UPDATE
USING (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'))
WITH CHECK (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));
CREATE POLICY "Admins and staff can delete projects in their org" ON public.projects FOR DELETE
USING (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));

CREATE POLICY "Admins and staff can view project staff in their org" ON public.project_staff FOR SELECT
USING (
    current_user_role() IN ('Admin', 'Staff')
    AND EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = project_staff.project_id
        AND projects.org_id = current_user_org()
    )
);
CREATE POLICY "Admins can insert project staff in their org" ON public.project_staff FOR INSERT
WITH CHECK (
    current_user_role() = 'Admin'
    AND EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = project_staff.project_id
        AND projects.org_id = current_user_org()
    )
);
CREATE POLICY "Admins can update project staff in their org" ON public.project_staff FOR UPDATE
USING (
    current_user_role() = 'Admin'
    AND EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = project_staff.project_id
        AND projects.org_id = current_user_org()
    )
)
WITH CHECK (
    current_user_role() = 'Admin'
    AND EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = project_staff.project_id
        AND projects.org_id = current_user_org()
    )
);
CREATE POLICY "Admins can delete project staff in their org" ON public.project_staff FOR DELETE
USING (
    current_user_role() = 'Admin'
    AND EXISTS (
        SELECT 1 FROM public.projects
        WHERE projects.id = project_staff.project_id
        AND projects.org_id = current_user_org()
    )
);

CREATE POLICY "Users can view tasks in their org" ON public.tasks FOR SELECT
USING (
    org_id = current_user_org()
    AND (
        current_user_role() IN ('Admin', 'Staff')
        OR (current_user_role() = 'Volunteer' AND assigned_to = auth.uid())
    )
);
CREATE POLICY "Admins and staff can insert tasks in their org" ON public.tasks FOR INSERT
WITH CHECK (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));
CREATE POLICY "Admins staff and assigned volunteers can update tasks in their org" ON public.tasks FOR UPDATE
USING (
    org_id = current_user_org()
    AND (
        current_user_role() IN ('Admin', 'Staff')
        OR (current_user_role() = 'Volunteer' AND assigned_to = auth.uid())
    )
)
WITH CHECK (
    org_id = current_user_org()
    AND (
        current_user_role() IN ('Admin', 'Staff')
        OR (current_user_role() = 'Volunteer' AND assigned_to = auth.uid())
    )
);
CREATE POLICY "Admins and staff can delete tasks in their org" ON public.tasks FOR DELETE
USING (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));

CREATE POLICY "Users can view contact logs in their org" ON public.contact_logs FOR SELECT
USING (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));
CREATE POLICY "Admins and staff can insert contact logs in their org" ON public.contact_logs FOR INSERT
WITH CHECK (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));
CREATE POLICY "Admins and staff can update contact logs in their org" ON public.contact_logs FOR UPDATE
USING (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'))
WITH CHECK (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));
CREATE POLICY "Admins and staff can delete contact logs in their org" ON public.contact_logs FOR DELETE
USING (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));

CREATE POLICY "Admins and staff can view resources in their org" ON public.resources FOR SELECT
USING (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));
CREATE POLICY "Admins and staff can insert resources in their org" ON public.resources FOR INSERT
WITH CHECK (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));
CREATE POLICY "Admins and staff can update resources in their org" ON public.resources FOR UPDATE
USING (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'))
WITH CHECK (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));
CREATE POLICY "Admins and staff can delete resources in their org" ON public.resources FOR DELETE
USING (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));

CREATE POLICY "Admins and staff can view resource transactions in their org" ON public.resource_transactions FOR SELECT
USING (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));
CREATE POLICY "Admins and staff can insert resource transactions in their org" ON public.resource_transactions FOR INSERT
WITH CHECK (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));
CREATE POLICY "Admins and staff can update resource transactions in their org" ON public.resource_transactions FOR UPDATE
USING (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'))
WITH CHECK (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));
CREATE POLICY "Admins and staff can delete resource transactions in their org" ON public.resource_transactions FOR DELETE
USING (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));

CREATE POLICY "Admins and staff can view budget entries in their org" ON public.budget_entries FOR SELECT
USING (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));
CREATE POLICY "Admins and staff can insert budget entries in their org" ON public.budget_entries FOR INSERT
WITH CHECK (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));
CREATE POLICY "Admins and staff can update budget entries in their org" ON public.budget_entries FOR UPDATE
USING (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'))
WITH CHECK (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));
CREATE POLICY "Admins and staff can delete budget entries in their org" ON public.budget_entries FOR DELETE
USING (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));

CREATE POLICY "Admins and staff can view staff in their org" ON public.staff FOR SELECT
USING (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));
CREATE POLICY "Admins can insert staff in their org" ON public.staff FOR INSERT
WITH CHECK (org_id = current_user_org() AND current_user_role() = 'Admin');
CREATE POLICY "Admins can update staff in their org" ON public.staff FOR UPDATE
USING (org_id = current_user_org() AND current_user_role() = 'Admin')
WITH CHECK (org_id = current_user_org() AND current_user_role() = 'Admin');
CREATE POLICY "Admins can delete staff in their org" ON public.staff FOR DELETE
USING (org_id = current_user_org() AND current_user_role() = 'Admin');

CREATE POLICY "Admins and staff can view gifts in their org" ON public.gifts FOR SELECT
USING (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));
CREATE POLICY "Admins and staff can insert gifts in their org" ON public.gifts FOR INSERT
WITH CHECK (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));
CREATE POLICY "Admins and staff can update gifts in their org" ON public.gifts FOR UPDATE
USING (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'))
WITH CHECK (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));
CREATE POLICY "Admins and staff can delete gifts in their org" ON public.gifts FOR DELETE
USING (org_id = current_user_org() AND current_user_role() IN ('Admin', 'Staff'));
