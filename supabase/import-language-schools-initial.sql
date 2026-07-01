-- One-time import of real language school outreach data from the operator's spreadsheet.
-- Review before running. This is business data, not disposable test data.
-- Relies on org_id defaults and does not hardcode organization IDs.

WITH imported_schools AS (
  INSERT INTO public.language_schools (
    name,
    city,
    state,
    contact_person,
    phone,
    email,
    website,
    source,
    status,
    last_contact_date,
    next_step,
    notes
  )
  VALUES
    (
      'Bright Kids ESL',
      'Sacramento',
      'CA',
      'Anna Smith',
      '916-555-1234',
      'info@brightkids.com',
      'www.brightkids.com',
      'Google',
      'New',
      '2026-04-30',
      'Call',
      NULL
    ),
    (
      'Happy Language School',
      'Fresno',
      'CA',
      'Maria Lopez',
      '559-222-4567',
      'maria@happylang.com',
      NULL,
      'Facebook',
      'Contacted',
      '2026-04-30',
      'Follow-up',
      'Asked for email info'
    )
  RETURNING id, name
)
INSERT INTO public.contact_logs (
  language_school_id,
  contact_date,
  type,
  notes,
  outcome,
  next_step
)
SELECT
  id,
  '2026-04-30 12:00:00-07'::timestamptz,
  'call',
  CASE
    WHEN name = 'Happy Language School' THEN 'Wants details'
    ELSE NULL
  END,
  CASE
    WHEN name = 'Bright Kids ESL' THEN 'No answer'
    WHEN name = 'Happy Language School' THEN 'Interested'
  END,
  CASE
    WHEN name = 'Bright Kids ESL' THEN 'Call again'
    WHEN name = 'Happy Language School' THEN 'Send email'
  END
FROM imported_schools;
