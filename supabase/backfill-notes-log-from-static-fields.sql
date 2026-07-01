-- One-time backfill from legacy static notes/next_step fields into notes log rows.
-- Review before running. This preserves existing text before edit forms stop
-- writing directly to parent notes/next_step columns.

WITH source_rows AS (
  SELECT
    'donor'::text AS entity_type,
    d.id AS entity_id,
    d.org_id,
    COALESCE(d.notes, '(no note text)') AS body,
    d.next_step,
    COALESCE(d.updated_at, d.created_at, now()) AS created_at
  FROM public.donors d
  WHERE d.notes IS NOT NULL
     OR d.next_step IS NOT NULL

  UNION ALL

  SELECT
    'church'::text AS entity_type,
    c.id AS entity_id,
    c.org_id,
    COALESCE(c.notes, '(no note text)') AS body,
    c.next_step,
    COALESCE(c.updated_at, c.created_at, now()) AS created_at
  FROM public.churches c
  WHERE c.notes IS NOT NULL
     OR c.next_step IS NOT NULL

  UNION ALL

  SELECT
    'language_school'::text AS entity_type,
    ls.id AS entity_id,
    ls.org_id,
    COALESCE(ls.notes, '(no note text)') AS body,
    ls.next_step,
    COALESCE(ls.updated_at, ls.created_at, now()) AS created_at
  FROM public.language_schools ls
  WHERE ls.notes IS NOT NULL
     OR ls.next_step IS NOT NULL
)
INSERT INTO public.notes (
  org_id,
  entity_type,
  entity_id,
  body,
  next_step,
  created_at
)
SELECT
  source_rows.org_id,
  source_rows.entity_type,
  source_rows.entity_id,
  source_rows.body,
  source_rows.next_step,
  source_rows.created_at
FROM source_rows
WHERE NOT EXISTS (
  SELECT 1
  FROM public.notes n
  WHERE n.entity_type = source_rows.entity_type
    AND n.entity_id = source_rows.entity_id
    AND n.body = source_rows.body
    AND n.next_step IS NOT DISTINCT FROM source_rows.next_step
    AND n.created_at = source_rows.created_at
);
