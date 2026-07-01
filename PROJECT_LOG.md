# PROJECT_LOG.md — snv (Mission CRM) — COLD

> Detailed history and retired session notes. Read only for provenance on a
> specific past decision or bug. PROJECT_STATE.md is the current source of truth —
> this file is background, not required reading for a session start.

## Session 1 — Cold start
First Director. Established identity, stack, team, initial decisions D1–D4. Read
local repo via Desktop Commander, found a mock-data prototype with a strong
TypeScript type model (`src/types/crm.ts`) and no working backend on `main`.

## Session 2 — Foundation reconciliation
Discovered Jules's real backend (schema, auth, Supabase client, donor CRUD, a
208-line migration) existed UNMERGED on a feature branch and had never been applied
to the database — despite an earlier summary claiming it was "done." Verified via
git (branch not an ancestor of main) + Supabase MCP (database was empty). Did not
rebuild — reviewed, fixed, and deployed the existing work instead. Quality (Director
review) caught two real bugs in the Code Agent's corrective migration: (1)
RESTRICTIVE RLS policies that would have locked out all users including Admins, (2)
a missing `gifts` table + wrong role enum (5-role instead of the agreed 3-tier).
Sent back, fixed, re-reviewed, applied both migrations live, smoke-tested, merged.
Hit a signup-blocking bug: `handle_new_user` threw "type user_role does not exist"
(SECURITY DEFINER function without a pinned search_path, couldn't resolve the
public-schema type). Diagnosed via Postgres logs, fixed with a follow-up migration,
verified, redeployed. Operator created the first Admin user and logged in
successfully — foundation proven end-to-end. Banked precedents P3 (SECURITY
DEFINER functions must schema-qualify + pin search_path) and P4 (smoke tests must
exercise a real signup, not just route checks).

## Session 3 — Security hardening + Churches + Projects
Ran a security-hardening migration (advisor-flagged function search_path warnings,
restricted anon execute on helper functions). Built and shipped the Churches module
(list/detail/create/edit/visit-log) and the Projects module (list/detail/create/edit
+ funding progress), each build-reviewed, live-tested by operator, merged. Added
"Add Funds" to Projects: a `gifts.project_id` link with a DB trigger
(`recalculate_project_current_funding`) that auto-sums a project's `current_funding`
from linked gift records — verified live (insert/delete math checked against the DB
directly before merge). `current_funding` became a DERIVED field from that point.

## Session 4 — Tasks + Notes + the date-control saga
Built and shipped the Tasks module (list/detail/create/edit/mark-complete) plus a
church-visit → auto-follow-up-task consistency fix (donors already had this).
The date input went through THREE fix attempts before it was solved properly:
(1) a submit-time `validDateOrNull` patch — fixed nothing, addressed the wrong
layer; (2) a native-picker close-on-outside-click handler — impossible, because the
native OS date picker renders outside the page DOM and can't be closed by page-level
JS; (3) the real fix — replaced the native `<input type=date>` entirely with an
in-page `react-day-picker` v10 calendar in `src/components/DateField.tsx`, with
timezone-safe local date-fns parsing. This finally held. Lesson: when a UI control
misbehaves twice in different ways, look for a wrong foundation, not another patch.
Also shipped append-only progress notes: a new `notes` table (RLS: Admin/Staff full,
Volunteers only their own task notes, no donor/church/project note access for
Volunteers) and a reusable `NotesLog` component, wired to Tasks first (designed to
be reusable elsewhere later).

## Session 5 — Budget
Built and shipped the Budget module (category-grouped overview with totals,
create/edit/delete), then a UX pass: category became a dropdown, and "Add Funds"
was added mirroring the Projects gift pattern — a new `budget_contributions` table
with its own auto-sum trigger (`recalculate_budget_entry_raised`), verified live the
same way as the Projects trigger. `budget_entries.raised` became DERIVED.

## Session 6 — Inventory + Dashboard
Built and shipped Inventory (resources, transaction history, create/edit) with a
quantity trigger (`recalculate_resource_quantities`) that derives `quantity_sold`
and `quantity_given` from transactions — `quantity_available` was DELIBERATELY left
manual (on-hand stock; auto-decrementing it was judged too ambiguous to get right
safely). Added transaction-amount auto-fill (price × quantity, still editable) and
an Inventory stats panel with a time-range selector; its date-range helper was
factored into a shared `src/lib/date-ranges.ts` when Dashboard became its second
consumer. Then replaced the Dashboard's mock data entirely with live queries: 5 stat
cards, an Inventory snapshot, and a "Needs Follow-Up" panel — deliberately NOT
labeled as the real engagement score (that doesn't exist yet), just an honest proxy
(overdue or stale donor contact). First appearance of a recurring Vercel deploy
quirk: pushing a branch and merging to main within seconds of each other can cause
Vercel's GitHub webhook to skip the production build. Fix: an empty commit to main
re-triggers it. Standing procedure since: push branch → wait ~10s → merge → push →
wait ~60s → verify production's deployed SHA matches the merge commit exactly (not
just "some deploy is READY") → if stale, empty-commit to re-trigger.

## Session 7 — User Management, Calendar, all 8 MVP modules complete
Built the most security-sensitive feature of the project: Admin-only user
management (create Staff/Volunteer accounts, delete accounts, edit any role
including promoting to Admin, reset passwords, self-service password change). This
required introducing the Supabase SERVICE ROLE key (server-only env var in Vercel,
`SUPABASE_SERVICE_ROLE_KEY`) via a dedicated `src/lib/supabase/admin.ts` helper with
a runtime `typeof window` guard, used only inside `"use server"` Server Actions.
Every privileged action shares one authorization helper (`getAdminCaller()`) that
does a real database role lookup against the CALLER's own session — never trusts a
client-submitted role claim. Director personally traced the import chain and the
authorization logic across all four privileged actions before merging each one.
Built-in safety rails: an Admin cannot delete or demote themselves, and the last
remaining Admin in an org cannot be deleted. Along the way, found and fixed a
real RLS gap dating back to session 1: `profiles` SELECT had always been "own row
only" for literally everyone (written before the role model existed) — a migration
now lets Admins view/update the whole team's profiles while Staff/Volunteers still
see only their own (operator's explicit call: full team visibility is Admin-only).
Also caught and fixed: no sign-out button existed anywhere in the app (a gap since
the very first login page, unnoticed until someone needed to switch accounts).
This work FINALLY allowed the one long-deferred verification: operator created a
real Volunteer account, logged in as them, and confirmed live on production that
they could not see donor data and could only see their own tasks — the Volunteer
RLS scoping built across many earlier sessions was proven correct in practice, not
just in policy text. Then built Calendar: a month-grid view aggregating four
existing tables (tasks, church visit dates, project start/end dates, contact log
history) with no table of its own — built by Claude Code after Codex hit its own
usage-limit lockout mid-session (an external tool constraint, unrelated to the repo
or infra). This closed out all 8 of the original MVP modules, fully live and
tested. Operator explicitly deferred an automated notification/follow-up-cadence
system (new-donor emails, gift-size-based call/email cadence) pending: (1) choosing
and configuring a transactional email service (none exists yet — Supabase does not
send arbitrary app emails), and (2) a dedicated design conversation about the actual
cadence rules, which the operator does not have yet ("I don't know how often...").
Session ended with a deliberate handoff at a clean milestone boundary, driven by
context-length management rather than any quality concern.
