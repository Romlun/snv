-- Project funding is derived from gifts linked to the project.
-- Existing manual edits to projects.current_funding remain possible, but any
-- gift change for a project will recalculate it from public.gifts.
ALTER TABLE public.gifts ALTER COLUMN donor_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.recalculate_project_current_funding()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        IF OLD.project_id IS NOT NULL THEN
            UPDATE public.projects
            SET current_funding = (
                SELECT COALESCE(SUM(public.gifts.amount), 0)
                FROM public.gifts
                WHERE public.gifts.project_id = OLD.project_id
            )
            WHERE public.projects.id = OLD.project_id;
        END IF;

        RETURN OLD;
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.project_id IS NOT NULL AND OLD.project_id IS DISTINCT FROM NEW.project_id THEN
        UPDATE public.projects
        SET current_funding = (
            SELECT COALESCE(SUM(public.gifts.amount), 0)
            FROM public.gifts
            WHERE public.gifts.project_id = OLD.project_id
        )
        WHERE public.projects.id = OLD.project_id;
    END IF;

    IF NEW.project_id IS NOT NULL THEN
        UPDATE public.projects
        SET current_funding = (
            SELECT COALESCE(SUM(public.gifts.amount), 0)
            FROM public.gifts
            WHERE public.gifts.project_id = NEW.project_id
        )
        WHERE public.projects.id = NEW.project_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER recalculate_project_current_funding_on_gifts
AFTER INSERT OR UPDATE OR DELETE ON public.gifts
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_project_current_funding();
