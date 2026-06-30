-- Resource quantity_sold and quantity_given are derived from transactions.
-- quantity_available remains a separately managed on-hand stock field so users
-- can correct inventory counts without fighting automatic decrements.
CREATE OR REPLACE FUNCTION public.recalculate_resource_quantities()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        UPDATE public.resources
        SET
            quantity_sold = (
                SELECT COALESCE(SUM(public.resource_transactions.quantity), 0)
                FROM public.resource_transactions
                WHERE public.resource_transactions.resource_id = OLD.resource_id
                  AND public.resource_transactions.type = 'sale'
            ),
            quantity_given = (
                SELECT COALESCE(SUM(public.resource_transactions.quantity), 0)
                FROM public.resource_transactions
                WHERE public.resource_transactions.resource_id = OLD.resource_id
                  AND public.resource_transactions.type = 'giveaway'
            )
        WHERE public.resources.id = OLD.resource_id;

        RETURN OLD;
    END IF;

    IF TG_OP = 'UPDATE' AND OLD.resource_id IS DISTINCT FROM NEW.resource_id THEN
        UPDATE public.resources
        SET
            quantity_sold = (
                SELECT COALESCE(SUM(public.resource_transactions.quantity), 0)
                FROM public.resource_transactions
                WHERE public.resource_transactions.resource_id = OLD.resource_id
                  AND public.resource_transactions.type = 'sale'
            ),
            quantity_given = (
                SELECT COALESCE(SUM(public.resource_transactions.quantity), 0)
                FROM public.resource_transactions
                WHERE public.resource_transactions.resource_id = OLD.resource_id
                  AND public.resource_transactions.type = 'giveaway'
            )
        WHERE public.resources.id = OLD.resource_id;
    END IF;

    UPDATE public.resources
    SET
        quantity_sold = (
            SELECT COALESCE(SUM(public.resource_transactions.quantity), 0)
            FROM public.resource_transactions
            WHERE public.resource_transactions.resource_id = NEW.resource_id
              AND public.resource_transactions.type = 'sale'
        ),
        quantity_given = (
            SELECT COALESCE(SUM(public.resource_transactions.quantity), 0)
            FROM public.resource_transactions
            WHERE public.resource_transactions.resource_id = NEW.resource_id
              AND public.resource_transactions.type = 'giveaway'
        )
    WHERE public.resources.id = NEW.resource_id;

    RETURN NEW;
END;
$$;

CREATE TRIGGER recalculate_resource_quantities_on_resource_transactions
AFTER INSERT OR UPDATE OR DELETE ON public.resource_transactions
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_resource_quantities();
