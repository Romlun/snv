CREATE TABLE public.notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT get_default_org_id(),
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    body TEXT NOT NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX notes_entity_type_entity_id_idx ON public.notes(entity_type, entity_id);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and staff can view notes in their org" ON public.notes FOR SELECT
TO authenticated
USING (org_id = public.current_user_org() AND public.current_user_role() IN ('Admin', 'Staff'));

CREATE POLICY "Admins and staff can insert notes in their org" ON public.notes FOR INSERT
TO authenticated
WITH CHECK (org_id = public.current_user_org() AND public.current_user_role() IN ('Admin', 'Staff'));

CREATE POLICY "Admins and staff can update notes in their org" ON public.notes FOR UPDATE
TO authenticated
USING (org_id = public.current_user_org() AND public.current_user_role() IN ('Admin', 'Staff'))
WITH CHECK (org_id = public.current_user_org() AND public.current_user_role() IN ('Admin', 'Staff'));

CREATE POLICY "Admins and staff can delete notes in their org" ON public.notes FOR DELETE
TO authenticated
USING (org_id = public.current_user_org() AND public.current_user_role() IN ('Admin', 'Staff'));

CREATE POLICY "Assigned volunteers can view their task notes" ON public.notes FOR SELECT
TO authenticated
USING (
    org_id = public.current_user_org()
    AND entity_type = 'task'
    AND public.current_user_role() = 'Volunteer'
    AND EXISTS (
        SELECT 1
        FROM public.tasks
        WHERE public.tasks.id = public.notes.entity_id
        AND public.tasks.org_id = public.current_user_org()
        AND public.tasks.assigned_to = auth.uid()
    )
);

CREATE POLICY "Assigned volunteers can insert their task notes" ON public.notes FOR INSERT
TO authenticated
WITH CHECK (
    org_id = public.current_user_org()
    AND entity_type = 'task'
    AND public.current_user_role() = 'Volunteer'
    AND EXISTS (
        SELECT 1
        FROM public.tasks
        WHERE public.tasks.id = public.notes.entity_id
        AND public.tasks.org_id = public.current_user_org()
        AND public.tasks.assigned_to = auth.uid()
    )
);
