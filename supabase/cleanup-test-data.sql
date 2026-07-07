-- Cleanup for supabase/seed-test-data.sql.
-- Deletes child rows first, then TEST DONOR / TEST CHURCH parent rows.
--
-- UPDATED (Director, Phase 0 hygiene pass): the original version only
-- cleared gifts + contact_logs before deleting the parent rows. Live
-- verification before running it found 6 orphaned `notes` rows (polymorphic
-- entity_id) and 1 orphaned `tasks` row (polymorphic related_to_id) that
-- would have been left dangling, pointing at deleted donor/church IDs.
-- Added those two deletes in the correct order (children before parents).

WITH test_donors AS (
  SELECT id
  FROM public.donors
  WHERE name LIKE 'TEST DONOR — %'
     OR name LIKE 'TEST DONOR—%'
),
test_churches AS (
  SELECT id
  FROM public.churches
  WHERE name LIKE 'TEST CHURCH — %'
     OR name LIKE 'TEST CHURCH—%'
)
DELETE FROM public.tasks
WHERE (related_to_type = 'donor' AND related_to_id IN (SELECT id FROM test_donors))
   OR (related_to_type = 'church' AND related_to_id IN (SELECT id FROM test_churches));

WITH test_donors AS (
  SELECT id
  FROM public.donors
  WHERE name LIKE 'TEST DONOR — %'
     OR name LIKE 'TEST DONOR—%'
),
test_churches AS (
  SELECT id
  FROM public.churches
  WHERE name LIKE 'TEST CHURCH — %'
     OR name LIKE 'TEST CHURCH—%'
)
DELETE FROM public.notes
WHERE (entity_type = 'donor' AND entity_id IN (SELECT id FROM test_donors))
   OR (entity_type = 'church' AND entity_id IN (SELECT id FROM test_churches));

WITH test_donors AS (
  SELECT id
  FROM public.donors
  WHERE name LIKE 'TEST DONOR — %'
     OR name LIKE 'TEST DONOR—%'
),
test_churches AS (
  SELECT id
  FROM public.churches
  WHERE name LIKE 'TEST CHURCH — %'
     OR name LIKE 'TEST CHURCH—%'
)
DELETE FROM public.gifts
WHERE donor_id IN (SELECT id FROM test_donors)
   OR church_id IN (SELECT id FROM test_churches);

WITH test_donors AS (
  SELECT id
  FROM public.donors
  WHERE name LIKE 'TEST DONOR — %'
     OR name LIKE 'TEST DONOR—%'
),
test_churches AS (
  SELECT id
  FROM public.churches
  WHERE name LIKE 'TEST CHURCH — %'
     OR name LIKE 'TEST CHURCH—%'
)
DELETE FROM public.contact_logs
WHERE donor_id IN (SELECT id FROM test_donors)
   OR church_id IN (SELECT id FROM test_churches);

DELETE FROM public.donors
WHERE name LIKE 'TEST DONOR — %'
   OR name LIKE 'TEST DONOR—%';

DELETE FROM public.churches
WHERE name LIKE 'TEST CHURCH — %'
   OR name LIKE 'TEST CHURCH—%';
