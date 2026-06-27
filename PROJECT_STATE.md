# PROJECT_STATE.md — snv (Mission CRM)

> Single source of truth. The Director is the ONLY writer. Code Agent edits this
> file only on explicit Director instruction. Designer and Quality never write it.
> Read this in full at every session start. Do not act on memory of prior sessions.

---

## 0. CHAT NAMING
Current title:
`snv Mission CRM — v0.1 Phase 1 (Foundation: DB + Auth + RLS)`
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

## 4. CURRENT STATE (session 1)
**What exists (verified on disk):**
- Full Next 16 app shell with route pages: donors, churches, projects, tasks,
  budget, calendar, inventory, settings; Sidebar + EngagementScoreRing components.
- Strong TypeScript domain model in `src/types/crm.ts` (donors, churches, projects,
  tasks, staff, resources, budget) — already includes engagement score, recurring
  giving fields, lifetime giving, donor stages, church engagement.
- **Running on mock fixtures** (`src/lib/mock-data.ts`), NOT a real backend.

**The gaps that ARE Phase 1:**
1. No database — schema, RLS, persistence all unbuilt.
2. No auth, no role/permission enforcement.
3. No Supabase client installed.
(Bilingual + finer roles are deliberately deferred — see decisions.)

**The prototype types are the schema blueprint.** The DB will match `crm.ts` shape so
the front-end needs minimal rework — with one normalization: embedded `givingHistory`
array becomes a proper `gifts` table (needed for engagement score + recurring tracking).

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
- ⚠️ Supabase project currently has NO schema — first migration is greenfield.

---

## 10. INFRA STATUS (verified session 1 via MCP)
- Supabase `snv` (`eriflhdyylssjnxygseq`) ACTIVE_HEALTHY, us-east-1, Postgres 17.6.
  Director MCP confirmed connected and able to operate.
- No migrations applied yet. No tables. No buckets. No edge functions.
- Vercel: linked. (Deployment verification pending first real build.)

## 11. AUTO-MERGE SCOPE
Conservative default: Director does NOT auto-merge migrations, RLS, auth, billing,
or customer-facing UI. All Phase 1 work touches these → every PR is operator-gated
at GATE 2 until further notice.

---

## 12. IN-FLIGHT WORK
- **NOW:** Director writing this file (done on commit) → then designing the Phase 1
  database schema + 3-tier RLS directly on Supabase via MCP, using `crm.ts` as
  blueprint. Additive/reversible → Director Tier-1 authority.
- **NEXT:** present schema to operator, then dispatch Designer (if UI rework needed)
  and Code Agent (install Supabase client, swap mock data → real queries).

## 13. SESSION NOTE (session 1)
Cold start, first Director. Established identity, stack, team, decisions D1–D4,
precedents P1–P2. Verified Supabase connectivity and read local repo via Desktop
Commander — found a working mock-data prototype with a strong type model and no
backend. Phase 1 reframed as "build the foundation under the existing shell."
Operator decisions this session: gifts manual-first; English-only structured for
later Russian; 3-tier roles. Next: schema design on Supabase.
