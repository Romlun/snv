# PROJECT_STATE.md — snv (Mission CRM)

> Single source of truth. The Director is the ONLY writer. Code Agent edits this
> file only on explicit Director instruction. Designer/Quality subagents (if used)
> never write it. Read this in full at every session start. Do not act on memory
> of prior sessions. Detailed history lives in PROJECT_LOG.md (COLD) — read only
> for provenance on a specific past decision; not required for a session start.

---

## 0. CHAT NAMING
Current title:
`snv Mission CRM — v0.6 Donation tracking (donors+churches), inline status, score breakdown LIVE`
On phase change, the Director gives a new title and bumps this line the same turn.

---

## 1. IDENTITY & MISSION
- **App:** snv — the Mission CRM for **Light in the East**.
- **Director:** (this Claude Project) — planner, architect, security, MCP operator,
  sole writer of this file.
- **Operator:** Roman (GitHub `Romlun`). Relays directives to the local Code Agent
  and reports results back. Final approver on product + irreversible ops.
- **Mission of the app:** one centralized system where the mission team can see who
  they work with, what's been done, what's next, who's responsible, and how the
  mission is progressing. The CRM must drive *action and follow-up* — not just
  store records. Guiding test for every feature: does it help the team notice and
  act on a relationship before it goes cold?

---

## 2. STACK (current, verified live)
- **Frontend:** Next.js **16.2.9** (App Router), React **19.2.4**, TypeScript,
  Tailwind v4.
  - ⚠️ **NON-STANDARD NEXT.JS.** Newer than agent training data. `AGENTS.md`
    mandates reading `node_modules/next/dist/docs/` before writing framework code.
    Repeat this instruction in every build directive.
- **UI libs:** lucide-react, clsx, tailwind-merge, date-fns, react-day-picker v10.
- **Backend:** Supabase (Postgres 17.6). Project `snv`, ref `eriflhdyylssjnxygseq`,
  region us-east-1, ACTIVE_HEALTHY. `@supabase/supabase-js` + `@supabase/ssr` fully
  installed and wired (`src/lib/supabase/client.ts`, `server.ts`, `admin.ts`).
- **Hosting:** Vercel. Project `snv` (`prj_7qTkMQbxPEEq1D14vkghNqAMQFQh`), team
  `ecm-os` (`team_onqVX5EAyfn5vbEvmLlmlwqc`). Production: **snv-zeta.vercel.app**.
- **Repo:** github.com/Romlun/snv, local clone `/Users/romanlunickin/snv`. Single
  branch model in practice: a long-lived feature branch
  (`feat/mission-crm-system-mvp-5918110685099165761`) that Code Agents work on,
  merged to `main` after Director review each time. `main` = what's deployed.

---

## 3. BUILD TEAM & FLOW (as actually practiced)
- **Code Agent:** Codex CLI or Claude Code, run locally by the operator in the repo
  — either works interchangeably on the same branch/AGENTS.md. Operator pastes
  Director's directive in, relays the report back. Only actor that writes source.
- **Quality:** in practice the Director performs this role directly — reads actual
  committed code via Desktop Commander (not just trusting the Code Agent's report),
  runs `npm run build`, greps for hazards (hardcoded org IDs, missing search_path,
  RLS gaps), and for DB migrations applies + tests them live before merging. A
  separate Quality subagent exists but has not been the practical bottleneck —
  the real gate is Director code-reading + live SQL verification.
- **Director** → applies/verifies Supabase migrations via MCP, merges branch→main
  locally via Desktop Commander git, verifies the Vercel production deploy lands on
  the exact merge SHA (see §10 deploy pattern), updates this file.
- **Operator** → final click-through test on production after every merge+deploy.
  This has repeatedly caught things code review alone missed (e.g. real signup
  flow, real date-typing behavior, real Volunteer-account RLS).

Standard build sequence per module/feature:
Director writes a precise directive → Code Agent builds + commits (NOT pushed by
default — Director pushes) → Director reads the actual diff, runs the build,
scans for hazards → if it's a migration, Director applies to live DB + tests the
SQL directly (insert/verify/delete, not just "it applied") → Director merges to
main → verifies production deploy SHA → operator click-tests on production →
Director updates this file.

---

## 4. CURRENT STATE — ALL 8 MVP MODULES + ENGAGEMENT SCORE + DONATION TRACKING LIVE (as of session 9)
The app is a real, working, tested production application. Every module below is
wired to the live Supabase database (no mock data remaining anywhere), enforces the
3-tier RLS role model, and has been personally click-tested by the operator on
**snv-zeta.vercel.app**:

- ✅ **Donors** — list/detail/create/edit, contact-log with auto-follow-up-task,
  "Add Gift" (general or project-linked, `gifts.donor_id` fixed to the donor,
  `project_id` optional), gift history list, inline relationship-status select
  (no navigation to edit), clickable Engagement Score ring showing a full
  breakdown popover (contact/giving/recurring/follow-up, each with points and
  the underlying fact — see `DonorEngagementScore.tsx`).
- ✅ **Churches** — list/detail/create/edit, visit log with auto-follow-up-task,
  "Plan Visit" (future visits, with type: call/visit/event/meeting), "Add Gift"
  (church-level giving, `gifts.church_id` fixed, `project_id` optional, no
  `donor_id`), gift history list, inline relationship-status select.
- ✅ **Projects** — list/detail/create/edit, funding progress, "Add Funds"
  (creates a `gifts` row; `current_funding` is DERIVED via trigger).
- ✅ **Tasks** — list/detail/create/edit/mark-complete, status dropdown,
  append-only progress notes (`NotesLog` component + `notes` table).
- ✅ **Budget** — category-grouped overview with totals, create/edit/delete,
  dropdown categories, "Add Funds" (creates a `budget_contributions` row;
  `raised` is DERIVED via trigger).
- ✅ **Inventory** — resources + transaction history, create/edit, sale/giveaway
  auto-updates `quantity_sold`/`quantity_given` via trigger (`quantity_available`
  stays manual by design), transaction amount auto-fills price×quantity, stats
  panel with time-range filter.
- ✅ **Dashboard** — live stat cards, Inventory snapshot, real **Engagement Score**
  panel ("Engagement Needs Attention" — donors below score 40, ascending), not a
  proxy anymore, Upcoming Tasks.
- ✅ **Calendar** — month-grid aggregating tasks/church visits/project
  dates/contact history (no table of its own).
- ✅ **User Management** (not in the original MVP list, became necessary) — Admin
  can create/delete/edit-role/reset-password for team members; everyone can change
  their own password; sign-out. See §10 for the security architecture — this was
  reviewed with extra care (service-role key involved).
- ✅ **Engagement Score** — real 0-100 score per donor, DB-computed and
  trigger-maintained (`donors.engagement_score`, repurposed from an unused
  prototype-era column — no new column needed). Formula (operator-approved
  Option A): contact recency 40pts + giving recency 25pts + recurring status
  15pts + follow-up health 20pts, linear decay within each recency band (no
  cliffs). Surfaced via `EngagementScoreRing` (donor detail, donors list,
  churches — plain, non-clickable) and `DonorEngagementScore` (donor detail +
  donors list only — wraps the ring with a click-to-expand breakdown popover
  via the `get_engagement_score_breakdown` RPC). See §6 P9 for a real bug
  caught and fixed during build.
- ✅ **Donation tracking (session 9)** — `gifts` now supports three optional
  attribution columns: `donor_id`, `project_id`, `church_id` (all nullable,
  a gift can be tied to any combination). Two more previously-stale
  prototype totals are now trigger-maintained the same way `engagement_score`
  was: `donors.lifetime_giving` and `churches.total_giving` (sum of gifts by
  `donor_id` / `church_id` respectively). `churches.engagement_score` is
  STILL the old unwired prototype value — same treatment as donors was NOT
  yet applied there; a natural future follow-up if the operator wants church
  scoring, not done because it wasn't asked for.

**What's NOT built yet, in priority order:**
1. **Notification/cadence automation** — DEFERRED, operator request. Needs (a) a
   transactional email service decision (none configured — Supabase does not send
   arbitrary app emails), and (b) a dedicated conversation to design the actual
   follow-up cadence rules (operator does not have these yet). Do NOT invent rules.
   NEXT UP — operator wants a dedicated conversation for this, not a quick dispatch.
2. **Reporting, AI features** — later phases, not yet scoped in detail.
3. **Deferred polish/design pass** — after functional work settles. Candidate tool:
   Stitch (Google AI UI-design MCP) — see §9 for the security caveat on its key.

---

## 5. STANDING DECISIONS
- **D1 — Gifts manual now, automatic later.** `gifts` table modeled for future
  processor capture (nullable `external_source`, `external_transaction_id`,
  idempotency key) — "make it automatic" must be a new integration, not a schema
  rewrite. Same pattern was reused for `budget_contributions`.
- **D2 — English-only now, structured for Russian later.** No i18n library/switcher
  yet. UI text should route through a single strings module long-term; this has
  NOT been rigorously enforced module-by-module — flag as a Phase 2 cleanup item
  if it matters before Russian is actually added.
- **D3 — 3-tier roles (Admin / Staff / Volunteer).** Enforced properly in RLS
  against real donor PII, verified live with a real Volunteer account (session 7).
  Finer 8-role model explicitly deferred — operator has no answer yet on when/if
  to build it (asked and deferred, session 7). Do not revisit without operator ask.
- **D4 — Full team visibility in Settings is Admin-only**, not Staff (operator
  decision, session 7) — Staff/Volunteers only see their own profile.
- **D5 — Admin account creation stays dashboard-only, not UI.** The User
  Management UI deliberately cannot create a new Admin (only Staff/Volunteer) —
  extra safety margin on the most powerful role. Promoting an EXISTING user to
  Admin IS possible via the UI (role dropdown), by design.
- **D6 — Password flow: Admin sets it directly**, no invite-email flow (operator's
  explicit choice, both for account creation and admin-initiated resets).

## 6. PRECEDENTS (banked principles — apply automatically, don't re-litigate)
- **P1 — Next 16 docs first.** Every directive touching framework code: read
  `node_modules/next/dist/docs/` before writing. No patterns from memory.
- **P2 — PII/secrets never in chat/logs/commits.** Service-role keys, donor PII
  never surfaced in directives, code, or this file.
- **P3 — SECURITY DEFINER funcs: schema-qualify + pin search_path = ''.** Every
  trigger function in this project follows this (`current_user_role`,
  `current_user_org`, `handle_new_user`, all the `recalculate_*` funcs). Cost a
  real signup-blocking bug once (session 2) — never skip this on a new function.
- **P4 — Smoke tests must exercise the REAL flow, not just build/route checks.**
  "It builds and redirects" is not "a user can actually do the thing." This is why
  the operator's manual click-through on production is a required step, not a
  formality — it has caught real bugs code review missed (date typing, real auth).
- **P5 — When a UI control fails twice in different ways, suspect the wrong
  foundation, not insufficient patching.** (The date-input saga, session 4 — see
  PROJECT_LOG.md — three attempts, the first two patched the wrong layer.)
- **P6 — Privileged server actions share ONE authorization helper**, never a
  re-implemented check per action. (`getAdminCaller()` in
  `src/app/settings/actions.ts` — reused across create/delete/role-edit/reset.)
- **P7 — Derived/trigger-maintained fields are never hand-edited via a form.**
  See §8 for the current list. When adding a new "total that sums child records"
  feature, default to this pattern (dedicated child table + SECURITY DEFINER
  trigger), proven three times now (gifts→projects, budget_contributions→budget,
  resource_transactions→resources).
- **P8 — After merging to main, verify the production deploy SHA matches the
  merge commit exactly** before telling the operator to test — don't trust "a
  deploy is READY." See §10 deploy pattern; this recurring Vercel quirk has bitten
  twice and has a known, reliable fix.
- **P9 — A BEFORE-trigger that recomputes a derived column must read from NEW,
  never re-query its own table.** Caught live (session 8, Engagement Score): a
  BEFORE UPDATE trigger called a helper function that did `SELECT ... FROM
  donors WHERE id = ...` to fetch its own inputs — but at BEFORE-trigger time the
  table still holds the OLD row, so the computed value was always one update
  behind the actual change (verified with a live insert/update/gift-add/gift-
  delete test cycle before merge, not just "it applied"). Fix: split into a pure
  calculation function that takes explicit parameter values, plus two callers —
  one that queries the DB (safe for AFTER triggers on a *different* table, where
  the row is already committed) and one that reads `NEW` directly (for BEFORE
  triggers on the row's own table). Apply this split any time a derived field is
  computed by a BEFORE trigger on the same row whose columns feed the formula.

## 7. ROLE / AUTH MODEL
3 tiers via a `role` enum on `profiles`, enforced in RLS (verified live):
- **Admin** — full read/write across all tables; only role that can manage other
  users (create/delete/edit-role/reset-password) and see the full team list.
- **Staff** — manage donors, churches, projects, tasks, contact logs, inventory,
  budget, gifts; can NOT manage other users or see the full team list.
- **Volunteer** — read/write only own assigned tasks + own task notes; NO access
  to donors, gifts, contact_logs, or other PII tables. CONFIRMED live, session 7.
Auth via Supabase Auth. Every table with PII has RLS ON from creation.

---

## 8. ACTIVE CONSTRAINTS / HAZARDS
- ⚠️ Next 16 is non-standard — see P1.
- ⚠️ Donor + church + gift + contact-log records are PII/financial. RLS before
  exposure, always. Volunteers must never gain access to these.
- ⚠️ PostgREST gotchas: no `.order('random()')`; no embedded-left-join null
  filters as "not exists"; `.select().limit()` caps at 1000 (use `.range()`/RPC).
- ⚠️ **DERIVED FIELDS — never hand-edit via a form, always via child records:**
  `projects.current_funding` (sums `gifts` where `project_id` set),
  `budget_entries.raised` (sums `budget_contributions`),
  `resources.quantity_sold` / `quantity_given` (sum `resource_transactions` by
  type), `donors.engagement_score` (BEFORE trigger on donors' own recency/status
  columns + AFTER trigger on `gifts` — see P9 for the staleness bug this pattern
  can hide if a BEFORE trigger re-queries instead of reading `NEW`),
  `donors.lifetime_giving` and `churches.total_giving` (both sum `gifts` by
  `donor_id` / `church_id` respectively — AFTER trigger on `gifts`).
  `resources.quantity_available` is the ONE manual exception (on-hand
  stock, deliberately not auto-decremented). `churches.engagement_score` is
  NOT yet in this list — still a stale manual prototype value, unlike every
  other derived field here.
- ⚠️ **Vercel deploy-skip pattern (recurring, has a known fix — P8):** pushing a
  branch and merging to main within seconds can make Vercel's GitHub webhook skip
  the production build. STANDARD PROCEDURE: push branch → wait ~10s → merge to
  main → push → wait ~60s → verify production's deployed SHA matches the merge
  commit exactly → if stale, empty-commit to main to re-trigger.
- ⚠️ The service-role key (`SUPABASE_SERVICE_ROLE_KEY`) exists in Vercel Production
  env only. It must NEVER be imported into any client-marked file — only via
  `src/lib/supabase/admin.ts`, only inside `"use server"` Server Actions, only
  after `getAdminCaller()` confirms the caller is a real Admin.
- ⚠️ Desktop Commander (local filesystem/git MCP) has intermittently gone
  unresponsive for several minutes at a time this project (twice, session 7) —
  transient, resolved by the operator restarting the local MCP connection. Not a
  repo/code issue when it happens; retry once, then ask the operator to restart.

## 9. DESIGN TOOL (future, not now)
Stitch (Google AI UI-design tool via MCP) is the intended designer for the
DEFERRED POLISH PHASE — not before. When adopted: (1) an API key was pasted in
chat earlier in this project and is COMPROMISED — a fresh one must be generated
and never pasted in chat; (2) verify what the MCP actually accesses before
connecting it to a repo holding donor PII.

## 10. INFRA STATUS (verified live, session 9)
- Supabase `snv` (`eriflhdyylssjnxygseq`) ACTIVE_HEALTHY, us-east-1, Postgres 17.6.
- **13 migrations applied and verified against live state** (0000 through 0012):
  initial schema → RLS/role/gifts corrections → handle_new_user search_path fix →
  function hardening (search_path + execute grants) → churches/donors/tasks visit
  automation (app-code, no migration) → project funding trigger → notes table →
  budget_contributions trigger → resource_transactions trigger → profiles
  team-visibility RLS fix → engagement score calculation (donors.engagement_score,
  repurposed prototype column) → engagement score BEFORE-trigger staleness fix
  (see P9) → engagement score search_path pin → gifts.church_id +
  churches.total_giving/donors.lifetime_giving derived triggers +
  get_engagement_score_breakdown RPC. All 13+ tables have full RLS coverage.
- Vercel: project `snv`, team `ecm-os`. Production READY on `main` at
  **snv-zeta.vercel.app**. Env vars set: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy `eyJ...` format, matches local
  `.env.local`), `SUPABASE_SERVICE_ROLE_KEY` (server-only, `sb_secret_...` format,
  Production scope).
- Local `.env.local` is gitignored, aligned to the same anon key as Vercel.
- Leaked-password protection: Supabase Pro-plan only, not enabled (free tier).
- `AGENTS.md.backup-102523` — untracked local junk file, harmless, delete whenever.

## 11. AUTO-MERGE SCOPE
Director does NOT auto-merge without reading the actual diff first (migrations,
RLS, auth, and privileged Server Actions get the most scrutiny). In practice every
merge this project has gone through Director review before merging — no PR-gate
ceremony has been needed since Director + operator click-test has been the
effective gate. Continue this pattern.

---

## 12. IN-FLIGHT WORK
- **NOW: nothing mid-flight.** Clean handoff point — donation tracking, inline
  relationship status, and score breakdown all shipped, merged, deployed.
  Director-level verification done (build clean, DB triggers tested live with
  insert/delete on a temp church, deploy SHA matches merge commit). Awaiting
  operator's click-test on production.
- **NEXT:** operator wants a dedicated conversation (not a quick dispatch) to
  design the notification/follow-up-cadence rules before any automation code —
  see §4 item 1. Do not build this reactively; it needs real product thinking,
  starting with a transactional email service decision (none configured yet).

## 13. SESSION NOTES
Detailed session-by-session history (sessions 1–7) lives in **PROJECT_LOG.md**
(COLD) — read it only if you need provenance on a specific past decision or bug.
It is NOT required reading to start working; everything currently load-bearing is
in this file's sections above (decisions, precedents, hazards, derived fields,
deploy pattern, current state).

**Session 8 note:** the Code Agent left its Engagement Score work uncommitted
directly on local `main` rather than on the feature branch — caught during
Director review, not a real problem (fixed by stashing, switching branches,
re-applying, committing there instead), but worth naming explicitly in future
directives which branch to work on rather than assuming it's understood. Also
worth noting: the Code Agent only built the Dashboard panel (1 of 3 requested
pieces) and didn't reuse `EngagementScoreRing.tsx` as instructed — turned out
the donor detail page and donors list already had it wired from an earlier
session, using the same column name the new migration repurposed, so nothing
was actually missing in the end, but that was discovered by the Director
reading the live donor detail/list pages directly, not from the Code Agent's
report. Reinforces P4/the Quality-role discipline: read the actual code, don't
trust a "done" report at face value.

**Handoff context for whoever reads this next:** this was a deliberate, clean swap
at a strong milestone (all 8 MVP modules just finished), driven by context-length
management in a very long single session — NOT by any quality problem, mistake, or
stuck situation. Inherit everything in this file verbatim; nothing here should be
re-litigated without a specific new reason. The operator is engaged, technical
enough to relay directives precisely, and has been doing real click-through testing
on production after every merge — trust that testing when it's reported as passed.

**Session 9 note:** unlike session 8, the Code Agent worked on the correct feature
branch, committed correctly, and completed all four requested parts (donor gift
tracking, church gift tracking, inline relationship status on both entities, and
the score breakdown popover) without skipping anything — confirmed by the Director
reading every file in the diff, not just trusting the report. Worth noting as a
data point rather than a rule: giving the Code Agent an explicit numbered list of
parts with "state completion status per part in your report" seems to correlate
with more complete follow-through than a looser directive. Not elevating this to a
precedent yet — one data point — but worth watching on the next multi-part
directive.
