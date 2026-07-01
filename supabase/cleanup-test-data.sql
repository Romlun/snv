-- Cleanup for supabase/seed-test-data.sql.
-- Deletes child rows first, then TEST DONOR / TEST CHURCH parent rows.

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
