CREATE TABLE public.budget_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE DEFAULT public.get_default_org_id(),
    budget_entry_id UUID REFERENCES public.budget_entries(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    contribution_date DATE NOT NULL DEFAULT CURRENT_DATE,
    note TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX budget_contributions_budget_entry_id_idx ON public.budget_contributions(budget_entry_id);

ALTER TABLE public.budget_contributions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins and staff can view budget contributions in their org" ON public.budget_contributions FOR SELECT
TO authenticated
USING (org_id = public.current_user_org() AND public.current_user_role() IN ('Admin', 'Staff'));

CREATE POLICY "Admins and staff can insert budget contributions in their org" ON public.budget_contributions FOR INSERT
TO authenticated
WITH CHECK (org_id = public.current_user_org() AND public.current_user_role() IN ('Admin', 'Staff'));

CREATE POLICY "Admins and staff can update budget contributions in their org" ON public.budget_contributions FOR UPDATE
TO authenticated
USING (org_id = public.current_user_org() AND public.current_user_role() IN ('Admin', 'Staff'))
WITH CHECK (org_id = public.current_user_org() AND public.current_user_role() IN ('Admin', 'Staff'));

CREATE POLICY "Admins and staff can delete budget contributions in their org" ON public.budget_contributions FOR DELETE
TO authenticated
USING (org_id = public.current_user_org() AND public.current_user_role() IN ('Admin', 'Staff'));

CREATE OR REPLACE FUNCTION public.recalculate_budget_entry_raised()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE public.budget_entries
        SET raised = (
            SELECT COALESCE(SUM(public.budget_contributions.amount), 0)
            FROM public.budget_contributions
            WHERE public.budget_contributions.budget_entry_id = OLD.budget_entry_id
        )
        WHERE public.budget_entries.id = OLD.budget_entry_id;

        RETURN OLD;
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.budget_entry_id IS DISTINCT FROM NEW.budget_entry_id THEN
        UPDATE public.budget_entries
        SET raised = (
            SELECT COALESCE(SUM(public.budget_contributions.amount), 0)
            FROM public.budget_contributions
            WHERE public.budget_contributions.budget_entry_id = OLD.budget_entry_id
        )
        WHERE public.budget_entries.id = OLD.budget_entry_id;
    END IF;

    UPDATE public.budget_entries
    SET raised = (
        SELECT COALESCE(SUM(public.budget_contributions.amount), 0)
        FROM public.budget_contributions
        WHERE public.budget_contributions.budget_entry_id = NEW.budget_entry_id
    )
    WHERE public.budget_entries.id = NEW.budget_entry_id;

    RETURN NEW;
END;
$$;

CREATE TRIGGER recalculate_budget_entry_raised_on_budget_contributions
AFTER INSERT OR UPDATE OR DELETE ON public.budget_contributions
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_budget_entry_raised();
