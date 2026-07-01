-- Reusable test data for engagement-score and donation-flow review.
-- Do not run in production without review.
-- Relies on org_id defaults and trigger-maintained derived fields.

WITH inserted_donors AS (
  INSERT INTO public.donors (
    name,
    email,
    phone,
    relationship_status,
    stage,
    last_contact_date,
    next_follow_up_date,
    interests,
    preferred_contact_method,
    tags,
    notes,
    years_supported,
    is_recurring,
    recurring_amount,
    recurring_cadence
  )
  VALUES
    (
      'TEST DONOR — Elena High Touch',
      'test-donor-elena@example.test',
      '555-0101',
      'Engaged',
      'Monthly supporter',
      CURRENT_DATE - INTERVAL '3 days',
      CURRENT_DATE + INTERVAL '14 days',
      ARRAY['Bible translation', 'monthly giving'],
      'email',
      ARRAY['test-data', 'high-engagement'],
      'Test donor with recent contact, recent gift, future follow-up, and recurring support.',
      5,
      TRUE,
      150.00,
      'monthly'
    ),
    (
      'TEST DONOR — Mark Steady Gift',
      'test-donor-mark@example.test',
      '555-0102',
      'Steady',
      'Active donor',
      CURRENT_DATE - INTERVAL '21 days',
      CURRENT_DATE + INTERVAL '30 days',
      ARRAY['radio ministry'],
      'phone',
      ARRAY['test-data', 'mid-engagement'],
      'Test donor with moderate contact and gift recency.',
      3,
      FALSE,
      NULL,
      NULL
    ),
    (
      'TEST DONOR — Nina Cooling',
      'test-donor-nina@example.test',
      '555-0103',
      'Cooling',
      'Interested',
      CURRENT_DATE - INTERVAL '75 days',
      CURRENT_DATE + INTERVAL '7 days',
      ARRAY['children resources'],
      'email',
      ARRAY['test-data', 'stale-contact'],
      'Test donor with stale contact but a scheduled follow-up.',
      1,
      FALSE,
      NULL,
      NULL
    ),
    (
      'TEST DONOR — Pavel Overdue',
      'test-donor-pavel@example.test',
      '555-0104',
      'At risk',
      'Needs re-engagement',
      CURRENT_DATE - INTERVAL '112 days',
      CURRENT_DATE - INTERVAL '15 days',
      ARRAY['church planting'],
      'text',
      ARRAY['test-data', 'overdue-follow-up'],
      'Test donor with stale contact and overdue follow-up.',
      2,
      FALSE,
      NULL,
      NULL
    ),
    (
      'TEST DONOR — Sofia Never Contacted',
      'test-donor-sofia@example.test',
      '555-0105',
      'Inactive',
      'New contact',
      NULL,
      NULL,
      ARRAY['new lead'],
      'email',
      ARRAY['test-data', 'never-contacted'],
      'Test donor with no contact or follow-up dates.',
      0,
      FALSE,
      NULL,
      NULL
    ),
    (
      'TEST DONOR — Victor Stale',
      'test-donor-victor@example.test',
      '555-0106',
      'Cooling',
      'First conversation',
      CURRENT_DATE - INTERVAL '95 days',
      CURRENT_DATE + INTERVAL '2 days',
      ARRAY['events'],
      'phone',
      ARRAY['test-data', 'stale-no-gift'],
      'Test donor with stale contact, near-term follow-up, and no gifts.',
      1,
      FALSE,
      NULL,
      NULL
    )
  RETURNING id, name
)
INSERT INTO public.gifts (
  donor_id,
  amount,
  gift_date,
  is_recurring,
  cadence,
  method,
  notes
)
SELECT id, amount, gift_date, is_recurring, cadence, method, notes
FROM inserted_donors
CROSS JOIN LATERAL (
  VALUES
    (
      CASE WHEN name = 'TEST DONOR — Elena High Touch' THEN 150.00 END,
      (CURRENT_DATE - INTERVAL '5 days')::date,
      TRUE,
      'monthly',
      'online',
      'TEST DATA: recent recurring donor gift.'
    ),
    (
      CASE WHEN name = 'TEST DONOR — Mark Steady Gift' THEN 75.00 END,
      (CURRENT_DATE - INTERVAL '45 days')::date,
      FALSE,
      NULL,
      'check',
      'TEST DATA: moderate-recency donor gift.'
    ),
    (
      CASE WHEN name = 'TEST DONOR — Nina Cooling' THEN 25.00 END,
      (CURRENT_DATE - INTERVAL '150 days')::date,
      FALSE,
      NULL,
      'cash',
      'TEST DATA: stale donor gift.'
    )
) AS gift_data(amount, gift_date, is_recurring, cadence, method, notes)
WHERE amount IS NOT NULL;

WITH inserted_churches AS (
  INSERT INTO public.churches (
    name,
    pastor,
    address,
    phone,
    email,
    denomination,
    relationship_status,
    next_visit_date,
    notes
  )
  VALUES
    (
      'TEST CHURCH — Grace Fellowship',
      'Pastor Anna Grace',
      '101 Test Ave, Review City',
      '555-0201',
      'test-church-grace@example.test',
      'Baptist',
      'Engaged',
      CURRENT_DATE + INTERVAL '21 days',
      'Test church with recent visit, recent gift, and future planned visit.'
    ),
    (
      'TEST CHURCH — Hope Chapel',
      'Pastor Boris Hope',
      '202 Test Ave, Review City',
      '555-0202',
      'test-church-hope@example.test',
      'Non-denominational',
      'Steady',
      CURRENT_DATE + INTERVAL '45 days',
      'Test church with a gift and future planned visit.'
    ),
    (
      'TEST CHURCH — Mercy Community',
      'Pastor Clara Mercy',
      '303 Test Ave, Review City',
      '555-0203',
      'test-church-mercy@example.test',
      'Pentecostal',
      'Cooling',
      CURRENT_DATE - INTERVAL '10 days',
      'Test church with a recently overdue visit.'
    ),
    (
      'TEST CHURCH — Renewal Church',
      'Pastor Daniel Renewal',
      '404 Test Ave, Review City',
      '555-0204',
      'test-church-renewal@example.test',
      'Methodist',
      'At risk',
      CURRENT_DATE - INTERVAL '45 days',
      'Test church with a long-overdue visit.'
    ),
    (
      'TEST CHURCH — Quiet Parish',
      'Pastor Eva Quiet',
      '505 Test Ave, Review City',
      '555-0205',
      'test-church-quiet@example.test',
      'Orthodox',
      'Inactive',
      NULL,
      'Test church with no scheduled visit.'
    )
  RETURNING id, name
),
inserted_church_gifts AS (
  INSERT INTO public.gifts (
    church_id,
    amount,
    gift_date,
    method,
    notes
  )
  SELECT id, amount, gift_date, method, notes
  FROM inserted_churches
  CROSS JOIN LATERAL (
    VALUES
      (
        CASE WHEN name = 'TEST CHURCH — Grace Fellowship' THEN 500.00 END,
        (CURRENT_DATE - INTERVAL '12 days')::date,
        'online',
        'TEST DATA: recent church gift.'
      ),
      (
        CASE WHEN name = 'TEST CHURCH — Hope Chapel' THEN 250.00 END,
        (CURRENT_DATE - INTERVAL '90 days')::date,
        'check',
        'TEST DATA: older church gift.'
      )
  ) AS gift_data(amount, gift_date, method, notes)
  WHERE amount IS NOT NULL
  RETURNING id
)
INSERT INTO public.contact_logs (
  church_id,
  contact_date,
  type,
  notes,
  outcome,
  next_step,
  next_follow_up_date
)
SELECT
  id,
  NOW() - INTERVAL '6 days',
  'church visit',
  'TEST DATA: recent church visit for engagement score review.',
  'Pastor wants a follow-up visit after sharing ministry updates.',
  'Schedule next partnership conversation.',
  CURRENT_DATE + INTERVAL '21 days'
FROM inserted_churches
WHERE name = 'TEST CHURCH — Grace Fellowship';
