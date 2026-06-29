# PROJECT_STATE.md — snv (Mission CRM)

> Single source of truth. The Director is the ONLY writer. Code Agent edits this
> file only on explicit Director instruction. Designer and Quality never write it.
> Read this in full at every session start. Do not act on memory of prior sessions.

---

## 0. CHAT NAMING
Current title:
`snv Mission CRM — v0.2 Phase 1 (Foundation DEPLOYED; modules next)`
On phase change, the Director gives a new title and bumps this line the same turn.

---

## 1. IDENTITY & MISSION
- **App:** snv — the Mission CRM for **Light in the East**.
- **Director:** (this Claude Project) — planner, architect, security, MCP operator,
  sole writer of this file.
- **Operator:** Roman (GitHub `Romlun`). Relays directives to the local Code Agent
  and reports back. Final approver on product + irreversible ops.
- **Mission of the app:** one centralized system where the mission team can see who
  they work with, what's been done, what's next, who's responsible, and how the
  mission is progressing. The CRM must drive *action and follow-up* — not just store
  records. Guiding test for every feature: does it help the team notice and act on a
  relationship before it goes cold?

---

## 2. STACK
- **Frontend:** Next.js **16.2.9** (App Router), React **19.2.4**, TypeScript, Tailwind v4.
  - ⚠️ **NON-STANDARD NEXT.JS.** This is Next 16 — newer than agent training data.
    `AGENTS.md` mandates reading `node_modules/next/dist/docs/` before writing any
    framework code. Every build directive must repeat this instruction.
- **UI libs present:** lucide-react, clsx, tailwind-merge, date-fns.
- **Backend:** Supabase (Postgres 17). Project `snv`, ref `eriflhdyylssjnxygseq`,
  region `us-east-1`, status ACTIVE_HEALTHY. Linked to Vercel.
  - ⚠️ `@supabase/supabase-js` is **NOT yet installed**. No DB client, auth, or
    persistence wired in yet. This is the core Phase 1 work.
- **Hosting:** Vercel (project linked to the repo + Supabase).
- **Repo:** github.com/Romlun/snv. Local clone: `/Users/romanlunickin/snv`.
  - Note: `package.json` name is still `temp-app` — rename when convenient (low priority).
  - Note: local has uncommitted work (src/components, src/lib, src/types) ahead of
    GitHub main as of session 1.

---

## 3. BUILD TEAM & FLOW
- **Designer** [Claude Code subagent] → DESIGN_SPEC.md before UI code. GATE 1 approval.
- **Code Agent** [Codex CLI / Jules] → only actor that writes source. Role file is
  `AGENTS.md` in repo (fully configured: minimal-change/YAGNI, git checkpoints,
  no self-approval, Director owns state).
- **Quality** [Claude Code subagent] → reviews + RUNS the work, cites evidence.
  On fail → QUALITY_REPORT.md → back to Code Agent.
- **Director** → creates/merges PRs via GitHub API (pg_net through Supabase MCP),
  verifies Vercel preview READY before merge, operates Supabase directly via MCP.
- Subagents installed at `/Users/romanlunickin/snv/.claude/agents`.

Build sequence: Designer → GATE 1 → Code Agent → Quality (evidence) → Director
PR/verify/merge → update this file → GATE 2.

---

## 4. CURRENT STATE (session 2 — FOUNDATION DEPLOYED)
**Phase 1 foundation is built, deployed, and verified.** Main now IS the real app.
- DB: both migrations applied to Supabase `snv` and verified against live state —
  13 tables incl. `gifts`; role enum = Admin/Staff/Volunteer; org "Light in the
  East" seeded; RLS ON every table with full CRUD policy coverage; trigger +
  helper funcs present.
- Code: Supabase client/server helpers (`src/lib/supabase/`), login, proxy
  middleware (`src/proxy.ts`), `src/types/database.ts`, donor pages on live
  queries — all merged to `main` (merge commit `5979757`).
- Deploy: Vercel production READY at **snv-zeta.vercel.app** on `main`.
- Smoke test passed (build OK, /login 200, /donors 307 redirect when unauth).

**What's still on mock data / unbuilt (this is Phase 1 remaining + Phase 3 work):**
- Only the **donors** module is wired to the DB. Churches, projects, tasks,
  budget, inventory, calendar, dashboard pages still read `src/lib/mock-data.ts`.
- No gift-entry UI yet (table exists; engagement score / recurring tracker compute
  off it once data flows).
- i18n strings module (D2) not yet created — strings still inline in components.

**Build order from here (per operator, build by business module, small milestones
of 2–5 days each, reviewed before next):** Churches → Projects → Tasks → Budget →
Inventory → Dashboard (replace mock metrics) → Reporting → AI features.

**Blueprint note:** `src/types/database.ts` (generated/typed to the live schema) is
now the authoritative type source for new module work, alongside `src/types/crm.ts`
(the original UI types). Reconcile against the DB, not mock-data shapes.

---

## 5. PHASE PLAN
- **Phase 1 (MVP) — CURRENT:** donor + church DBs, contact history, follow-up
  reminders, projects, tasks, book inventory, budget, dashboard, engagement score,
  recurring-giving tracker. PLUS the foundation those sit on: Postgres schema, auth,
  3-tier RLS, Supabase client, swap mock data → real data.
- **Phase 2:** segmentation/filtering, unified profile timeline, pledges & grants,
  board-ready reports, finer 8-role permissions, **Russian language + switcher**.
- **Phase 3:** rousable journeys (welcome/re-engagement/post-visit), bilingual
  templates + readability check, relationship map, deeper impact tracking,
  automatic gift capture integration.

---

## 6. STANDING DECISIONS
- **D1 — Gifts manual now, automatic later.** Gifts entered by hand in MVP, but the
  `gifts` table is modeled for future processor capture: nullable `external_source`,
  nullable `external_transaction_id`, an idempotency key, and NO assumption that a
  human is the only writer. "Make it automatic" must be a new integration, not a
  schema rewrite.
- **D2 — English-only now, structured for Russian later.** No i18n library or
  switcher yet. BUT: no user-facing string is hardcoded inline — all UI text routes
  through a single strings module (one `en` dictionary). `staff.language` column
  exists, defaults `en`. Adding Russian later = write `ru` dictionary + switch, not
  a hunt for hardcoded labels.
- **D3 — 3-tier roles now (Admin / Staff / Volunteer).** RLS enforced properly for
  these three against real donor PII. Schema shaped so the finer 8 roles
  (Mission Director, Finance Manager, Project Manager, Donor Relations, Church
  Relations) slot in later without migration pain. Correctness over richness —
  donor PII is involved.
- **D4 — DB matches `crm.ts`.** Schema mirrors existing TypeScript types so UI
  doesn't get reworked; only `givingHistory` is normalized into a `gifts` table.

## 7. PRECEDENTS (banked principles)
- **P1 — Next 16 docs first.** Every Code Agent directive touching framework code
  must instruct: read `node_modules/next/dist/docs/` before writing. No patterns
  from memory.
- **P2 — PII never in chat/logs/commits.** Service-role keys, donor personal data
  never surfaced in directives, code, or this file.
- **P3 — SECURITY DEFINER funcs: qualify types + pin search_path.** Any function
  that runs as SECURITY DEFINER (esp. auth triggers like handle_new_user) MUST
  schema-qualify custom types (`public.user_role`, not `user_role`) AND set
  `search_path = public`. Without it, the func can't resolve public-schema types at
  runtime → "Database error creating new user" on signup. (Cost us a signup-blocking
  bug, session 2.)
- **P4 — Smoke tests must exercise a real auth signup**, not just route/redirect
  checks. The search_path bug passed build + route checks but broke actual user
  creation. "It builds and redirects" is not "a user can sign up and log in."

---

## 8. ROLE / AUTH MODEL (MVP)
3 tiers via a `role` enum on the user/staff record, enforced in RLS:
- **Admin** — full read/write across all tables.
- **Staff** — manage donors, churches, projects, tasks, contact logs, inventory,
  budget; read team data. (Default for mission team members.)
- **Volunteer** — read/write only their own assigned tasks; no donor PII access.
Auth via Supabase Auth. Every table with PII gets RLS ON from creation — never a
table exposed before its policy exists.

---

## 9. ACTIVE CONSTRAINTS / HAZARDS
- ⚠️ Next 16 is non-standard — see P1.
- ⚠️ Donor + church records are PII. RLS before exposure, always.
- ⚠️ PostgREST gotchas apply: no `.order('random()')`; no embedded-left-join null
  filters as "not exists"; `.select().limit()` caps at 1000 (use `.range()`/RPC).
- ⚠️ Schema is LIVE with full RLS. New module work must respect existing policies
  (Admin/Staff full data access; Volunteer = own tasks only, no donor/gift/contact PII).

---

## 10. INFRA STATUS (verified session 2 via MCP)
- Supabase `snv` (`eriflhdyylssjnxygseq`) ACTIVE_HEALTHY, us-east-1, Postgres 17.6.
- **Both migrations APPLIED + verified:** 20250627000000_initial_schema,
  20250627000001_director_corrections. 13 tables, RLS full coverage, role enum
  Admin/Staff/Volunteer, gifts table with future-capture cols, org seeded.
- Vercel: project `snv` (`prj_7qTkMQbxPEEq1D14vkghNqAMQFQh`), team `ecm-os`
  (`team_onqVX5EAyfn5vbEvmLlmlwqc`). Production READY on `main` at
  **snv-zeta.vercel.app** (merge commit `5979757`).
- Env vars: Vercel Production uses legacy `eyJ...` anon key; local `.env.local`
  aligned to the SAME legacy key. Both valid for the project.
  - Future cleanup (low priority): optionally standardize both to the new
    `sb_publishable_...` key. Not required — both work.
- `AGENTS.md.backup-102523` is an untracked local junk file — delete or gitignore
  (not committed; harmless).

## 11. AUTO-MERGE SCOPE
Conservative default: Director does NOT auto-merge migrations, RLS, auth, billing,
or customer-facing UI. All Phase 1 work touches these → every PR is operator-gated
at GATE 2 until further notice.

---

## 12. IN-FLIGHT WORK
- **NOW:** Nothing mid-flight. Foundation fully live + verified end-to-end: first
  Admin user created via signup, logged in successfully. 3 migrations applied
  (initial, corrections, handle_new_user search_path fix), all merged to main,
  production READY (commit `968dbef`).
- **NEXT (awaiting operator go):** First business module = **Churches** — wire the
  existing churches pages to the live DB (list/create/edit + visit logs), replace
  mock-data, respect RLS. Small milestone → Quality (incl. real auth-path test per
  P4) → review → merge.
- **Process change (operator):** build by business module, milestones 2–5 days,
  each reviewed before the next.

## 13. SESSION NOTE (session 2)
Reconciled a major surprise: the "Phase 1 foundation unbuilt" assumption from
session 1 was wrong. Jules's real backend (schema, auth, Supabase client, donor
CRUD, 208-line migration) existed UNMERGED on branch feat/mission-crm-system-mvp-…
and was never applied to the DB. Verified via git (branch not ancestor of main) +
MCP (empty DB). Did NOT rebuild — verified and deployed the existing work instead.
Quality caught two real bugs in the Code Agent's corrective migration: (1) RESTRICTIVE
policies that would have locked out all users incl. Admins, (2) initially missing
gifts table + wrong role enum. Sent back, fixed, re-reviewed. Applied both migrations
to live DB, verified, smoke-tested (build OK, auth redirect works), merged to main,
confirmed Vercel production READY at snv-zeta.vercel.app. Aligned local + Vercel
anon keys (both legacy eyJ). Then hit a signup-blocking bug: handle_new_user trigger
threw "type user_role does not exist" (SECURITY DEFINER + no search_path). Diagnosed
via postgres logs, fixed with migration 20250627000002 (qualify type + set
search_path), applied, merged, redeployed. Operator created first Admin user and
logged in successfully — foundation proven end-to-end. Banked P3 + P4. Next: Churches.
