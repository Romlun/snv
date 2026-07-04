# DESIGN_SPEC.md — snv Mission CRM: "Soft Luminous" Implementation Spec

> Status: DRAFT — for Director/Roman approval. No application code has been
> written or modified as part of producing this document. Scope: translate
> the already-approved `DESIGN.md` system into a concrete, buildable spec for
> this specific Next.js 15/canary + Tailwind v4 codebase.
>
> Produced by: Designer role, via the `ui-ux-pro-max` skill (invoked to
> cross-check the Soft Luminous direction against general design-system best
> practice — component states, accessibility floors, elevation conventions —
> before locking token values). Source of truth for palette/type/spacing
> remains `DESIGN.md` + the actual Stitch `code.html` exports, per DESIGN.md's
> own instruction to reuse the documented system exactly and flag rather than
> improvise where something doesn't translate.
>
> This is a **from-scratch visual pass** — the current app has no design
> tokens today (`globals.css` is still Next.js starter defaults, Geist fonts,
> zinc/blue inline Tailwind utilities repeated per page). Nothing here is a
> refresh of an existing token set.

---

## 0. What I actually read before writing this

- `DESIGN.md` (repo root) — full token/component summary and Code-Agent notes.
- Stitch export `code.html` for: `mission_dashboard_standardized_soft_luminous_view`,
  `donor_management_soft_luminous_redesign`, `new_budget_entry_unified_layout`,
  and grepped `donor_profile_elena_rodriguez_soft_luminous` for badge/avatar
  patterns. This mattered — the actual markup diverges from DESIGN.md's prose
  summary in a few places documented in §8 below, most importantly the
  **glass-card treatment is NOT consistent across the mock set itself**
  (dashboard uses real `backdrop-filter: blur(8px)` + translucent white;
  donor-management and budget-form pages define a `.glass-card` class that is
  actually solid opaque white with only a border + shadow + hover-lift, no
  blur at all). DESIGN.md's "verified against actual code" correction only
  checked one page.
- Current app: `src/app/globals.css`, `src/app/layout.tsx`,
  `src/components/Sidebar.tsx`, `src/app/page.tsx` (dashboard),
  `src/app/donors/page.tsx` (list), `src/app/donors/new/page.tsx` (form).

---

## 1. Pattern / overall direction (one line)

Editorial-calm mission dashboard: warm cream surfaces, one terracotta accent
used sparingly, Playfair Display serif headlines over an all-Inter functional
UI, soft frosted/tonal cards with a gentle hover lift — premium and legible,
never neon, never a generic dark-mode SaaS look.

---

## 2. Colors (hex, with roles)

The real Stitch config carries more tokens than DESIGN.md's summary table
printed. Values below are taken directly from the `code.html` `tailwind.config`
blocks (identical across all three files I opened), which I'm treating as more
reliable than DESIGN.md's condensed table for anything they disagree on
(flagged inline).

| Token | Hex | Role |
|---|---|---|
| `primary` | `#9b4426` | Primary actions (terracotta). Used sparingly — max one primary-filled button visible per screen. |
| `on-primary` | `#ffffff` | Text/icons on `primary` fill |
| `primary-container` | `#e27b58` | Lighter terracotta — hover state for primary, secondary emphasis, progress-bar fills, avatar tint backgrounds (`/10` opacity) |
| `on-primary-container` | `#ffffff` | Text on `primary-container` fill |
| `secondary` | `#515f74` | Slate navy — secondary nav text, secondary actions |
| `on-secondary` | `#ffffff` | Text on `secondary` fill |
| `secondary-container` | `#d5e3fc` | Rare — light blue container (seen once, avatar bg variant) |
| `on-secondary-container` | `#57657a` | Text on `secondary-container` |
| `tertiary` | `#516072` | Rare accent for a third avatar-tint variant |
| `background` | `#fff8f6` | Page background (creamy, warm white) |
| `on-background` | `#111c2d` | Default text on background |
| `surface` | `#ffffff` | Card/panel fill (opaque white — see glass-card note §8) |
| `on-surface` | `#111c2d` | Primary text on surface (near-black, slightly blue) |
| `surface-variant` | `#f9f9ff` | Secondary surface tint (cooler, barely-there blue-white) |
| `on-surface-variant` | `#55423d` | Muted/secondary text — warm brown-gray, NOT neutral gray |
| `outline` | `#89726b` | Default border/outline color for stronger dividers |
| `outline-variant` | `#dcc1b9` | Low-contrast dividers, scrollbar thumb |
| `surface-container-low` | `#fff1eb` | Table header bg, subtle section backgrounds |
| `surface-container` | `#ffeae0` | Sidebar nav-link hover bg |
| `surface-container-high` | `#fce3d9` | Active sidebar nav bg, progress-bar track bg |
| `paper-neutral` | `#F5EFEF` | Sidebar background, input fill (the "paper" surface for form fields and the sidebar shell — distinct from card surfaces) |
| `error` | `#ba1a1a` | Overdue/error states (from DESIGN.md; not in the Stitch Tailwind config directly — status reds in the mocks actually use plain Tailwind `red-*` utilities, see §8 flag) |

**Status/semantic scale** (derived from actual badge usage in the donor
management mock, not invented — this is the real pattern to reuse):

| Status | Background | Text | Border | Example use |
|---|---|---|---|---|
| Success / Active / OK | `bg-green-100` | `text-green-800` | `border-green-200` | Active donor/church status, high engagement score bar |
| Warning / Pending / At-risk | `bg-amber-50` or `primary-container/10` | `text-amber-700` / `text-primary` | `border-amber-200` / `primary-container/20` | Lead status, mid engagement score, "At risk" chip |
| Error / Overdue / Lapsed | `bg-red-100` (list rows) / `bg-red-50` (compact chips) | `text-red-800` / `text-red-600` | `border-red-200` / `border-red-100` | Lapsed donor status, low engagement score, overdue reminders |
| Info / Neutral | `bg-blue-100` | `text-blue-800` | `border-blue-200` | "Lead" status chip (Stitch mock uses blue for this, not amber — kept as-is since it's a distinct funnel stage, not a warning) |

This is a **low-saturation-fill-with-dark-text** pattern per DESIGN.md's
component rule — badges never use a full-saturation solid fill, always the
`-100`/`-50` tint + `-800`/`-700` text + matching light border. Keep using
literal Tailwind `red-*`/`green-*`/`blue-*`/`amber-*` utility scales for
status badges (they already ship with Tailwind v4, no new tokens needed) —
only the four Soft Luminous brand/surface tokens above need to become custom
`@theme` colors.

---

## 3. Typography

Dual-typeface, exactly as DESIGN.md specifies, confirmed against the Stitch
`fontSize`/`fontFamily` extensions in all three files read:

| Style | Font | Size / Line-height | Weight |
|---|---|---|---|
| `headline-xl` | Playfair Display | 48px / 1.2, `-0.02em` tracking | 700 |
| `headline-lg` | Playfair Display | 32px / 40px | 600 |
| `headline-md` | Playfair Display | 24px / 32px | 500–600 (mock uses 500 in fontSize def but 600/bold in practice on card titles — use 600 as the default, 500 only if a lighter touch is explicitly wanted) |
| `body-lg` | Inter | 18px / — | 400 |
| `body-md` | Inter | 16px / 24px | 400 |
| `label-md` | Inter | 14px / 20px | 600 |
| `label-sm` | Inter | 12px / 16px | 500 |

Rules (unchanged from DESIGN.md, restated because they're load-bearing):
- Playfair Display **only** for page/section headline text (`<h1>`/`<h2>`
  equivalents, the dashboard greeting, card section titles like "Today's
  Attention Registry"). Never for table data, form labels, button text, nav
  items, or anything a user needs to scan quickly.
- Everything functional is Inter: labels, body copy, nav, inputs, table cells,
  buttons.
- Numeric/data columns (Engagement Score, currency, counts) get `tabular-nums`
  (`tnum`) so digits align in tables — add `tabular-nums` Tailwind utility
  wherever a numeric column exists (donor list score/giving columns, budget
  amounts, stat cards).
- Uppercase + wide tracking + `label-sm` is the mock's recurring pattern for
  section eyebrows ("ACTIVE DONORS", "STATUS:") — reuse this, don't invent a
  new small-caps treatment.

---

## 4. Layout & spacing scale

- 12-column grid, **1280px max content width**, 24px gutters (`gutter`).
- Spacing scale (as literal `@theme` spacing tokens, matching the Stitch
  config's custom spacing keys so classes like `p-md`/`gap-gutter` work):
  `sm` 8px, `md` 16px, `lg` 24px, `xl` 32px, `gutter` 24px, `stack-md` 16px,
  `stack-lg` 32px, `margin-safe` 32px (used once, for the donor-management
  page's `main` padding — fold into `xl`, don't add a near-duplicate token —
  see §8).
- Left-aligned content, generous margins, not centered/boxed (the app shell's
  content area, not the page content itself, which does use a max-width
  wrapper).
- Radius scale: `DEFAULT` 8px (0.5rem), `lg` 12px (0.75rem), `xl` 16px (1rem),
  `full` 9999px. Cards use `xl` (16px, matches DESIGN.md). Buttons/inputs use
  `DEFAULT`/`lg` (8–12px — the mocks are inconsistent between exactly 8px and
  a slightly larger radius on buttons; standardize on `lg` (0.75rem/12px) for
  buttons and `DEFAULT` (8px) for inputs, since DESIGN.md explicitly says
  "Buttons/inputs: 8px" — flagging the button radius as the one place I'm
  rounding up slightly from the letter of DESIGN.md to match what's actually
  rendered in every button example in the mocks, which reads closer to 10–12px
  than a strict 8px). Search bars: `full` (pill).

---

## 5. Elevation & the glass-card treatment

Tonal layers, not heavy drop shadows, per DESIGN.md. **Concrete correction
found by reading actual code, beyond what DESIGN.md's own correction
covered:** the `.glass-card` class is defined *differently* in different
Stitch export pages:

- Dashboard (`mission_dashboard_standardized_soft_luminous_view/code.html`):
  ```css
  .glass-card {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(8px);
    border: 1px solid rgba(137, 114, 107, 0.15);
  }
  ```
  True frosted glass — this is the one DESIGN.md quoted.

- Donor management + new-budget-entry pages: `.glass-card` is redefined as
  **opaque white**, no blur:
  ```css
  .glass-card {
    background: #ffffff;
    border: 1px solid rgba(137, 114, 107, 0.15);
    box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
  }
  .glass-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 30px -10px rgba(155, 68, 38, 0.12);
  }
  ```

**Decision (flagging for Director/Roman confirmation, not improvising
silently):** ship ONE canonical `.glass-card` utility for this codebase using
the dashboard's true-glass version (translucent + blur), since that's the
version DESIGN.md explicitly called out as "verified against actual code" and
it's the more distinctive, on-brand treatment — the opaque version is
visually just "a card with a shadow," which is what the CURRENT app already
has today. Recommend real glass everywhere card-level content sits above
`background`/`surface-variant`, so the frost effect is actually visible
(it's invisible over a plain white page). Apply the hover-lift transform +
shadow from the *second* definition (translateY(-2px) + terracotta-tinted
shadow) on top of the first's background/blur — that's the best-of-both
merge, expressed as plain CSS `:hover`, no JS needed (the mocks' own
`mouseenter`/`mouseleave` JS is unnecessary, confirmed by DESIGN.md).

Final `.glass-card` for `globals.css`:
```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(137, 114, 107, 0.15);
  border-radius: var(--radius-xl);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.glass-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px -10px rgba(155, 68, 38, 0.12);
}
@media (prefers-reduced-motion: reduce) {
  .glass-card { transition: none; }
  .glass-card:hover { transform: none; }
}
```

Elevation levels:
- **Level 0** (page background): flat, `background` token, no shadow.
- **Level 1** (cards): `.glass-card` above.
- **Level 2** (modals/dropdowns/popovers): opaque white, no blur, a more
  defined shadow — `box-shadow: 0 8px 24px -4px rgba(17,28,45,0.12)` (navy-
  tinted per DESIGN.md, not terracotta — terracotta shadow is reserved for
  card hover, navy/on-surface-tinted shadow is for overlay elevation, keeps
  the two elevation idioms visually distinct).
- **Dividers**: 1px solid `outline-variant` at low opacity (`/10`–`/20` as
  seen throughout the mocks), never a heavy border.
- Sticky header bar treatment (`bg-white/80 backdrop-blur-md`) is a distinct,
  reusable pattern from `.glass-card` — call it out separately as the
  **app-bar blur** rather than folding it into the card utility, since it's
  full-bleed and sticky, not a discrete card.

---

## 6. Component states (default / hover / focus / disabled)

Applies across all interactive components below. Non-negotiable floor:
**every focusable element gets a visible keyboard focus ring** — the mocks
mostly rely on `focus:ring-2 focus:ring-primary-container/20`, which is
correct in spirit but too low-contrast (20% opacity terracotta on a cream
background) to reliably clear WCAG's non-text contrast requirement (3:1)
against `background`/`surface`. Spec value: `focus-visible:ring-2
focus-visible:ring-primary focus-visible:ring-offset-2
focus-visible:ring-offset-surface` (full-strength `primary`, not the 20%
container tint, offset so it's visible against both white and cream
backgrounds). Use `focus-visible` not `focus` so mouse clicks don't show a
ring, only keyboard nav does.

- **Default:** as specified per component below.
- **Hover:** `primary-container` tint shift (backgrounds lighten toward
  `primary-container/5`–`/10`, borders shift toward `primary-container`),
  OR the `.glass-card` lift for card-level containers. Never a hue change on
  hover, only opacity/lightness — keeps the accent restrained.
  Table rows: `hover:bg-primary-container/5`.
- **Focus:** ring treatment above, applied to all inputs, selects, buttons,
  and links that act as controls (not plain inline text links, which get a
  simple underline/color change instead).
  **Amendment: Text links must ALSO get a visible focus-visible outline**
  (not none) — the mocks show `hover:underline` for links but no explicit
  focus state; add `focus-visible:ring-2 focus-visible:ring-primary
  focus-visible:rounded-sm` to interactive links, not just buttons/inputs.
- **Disabled:** `opacity-50`, `cursor-not-allowed`, no hover/focus treatment,
  pointer-events removed where it's a button (matches the existing
  `disabled:opacity-50` pattern already used in `donors/new/page.tsx` — keep
  this convention, it already exists and is fine).

---

## 7. Component-by-component spec

### 7.1 Button

**Current state:** no `Button.tsx` exists. Every page inlines its own button
classes — e.g. `donors/page.tsx`'s "Add Donor" is
`bg-blue-600 text-white ... rounded-lg hover:bg-blue-700`, `donors/new`'s
submit is `w-full bg-blue-600 ... rounded-lg`. Blue accent throughout, no
shared component, no variant system.

**Target:** extract `src/components/ui/Button.tsx`. This is exactly the kind
of shared primitive DESIGN.md says must be built before any page work — every
page currently reinvents it slightly differently (compare the two blue
buttons above: same intent, different exact classes).

Variants:
- `variant="primary"` — `bg-primary text-on-primary` fill, `hover:bg-primary-container`,
  `rounded-lg` (12px), `px-6 py-3` (or `px-4 py-2` for compact), `shadow-sm`,
  `font-label-md` weight. **Enforce at most one visible per screen** — this
  is a hard rule from DESIGN.md, not a suggestion; if a page wants two
  "primary-looking" actions, the second one must be `secondary` or
  `tertiary`/ghost, never a second `primary`.
- `variant="secondary"` — `border border-secondary text-secondary bg-transparent`,
  `hover:bg-secondary/5` (navy outline, transparent fill, per DESIGN.md).
  Note: the mocks' actual secondary-looking buttons (e.g. "Plan visit", "Log
  contact" in the dashboard's Attention Registry) use a **terracotta** outline
  (`border-primary text-primary hover:bg-primary/5`), not navy — this is a
  real discrepancy between DESIGN.md's prose ("Secondary = navy outline") and
  every actual secondary-button instance in the mocks (all terracotta-
  outlined). **Flagging this for Roman:** recommend following the mocks
  (terracotta-outline secondary) since it's the consistent, repeated pattern
  across every page that has this button type, and a navy secondary button
  never actually appears anywhere in the export. Ship terracotta-outline as
  `secondary` unless told otherwise.
- `variant="ghost"` — text-only, `text-on-surface-variant hover:text-primary`,
  used for "View all →" links and table row-actions (`more_vert` menu
  trigger).
- `variant="destructive"` — for delete actions that don't exist in the mocks
  but exist in the app today (e.g. any delete confirmation) — `bg-red-600
  text-white hover:bg-red-700`, since no Soft Luminous mock covers this case,
  reuse plain Tailwind red at full saturation (destructive actions are the
  one place a strong warning color is appropriate, this is a deliberate,
  narrow exception to "no full-saturation fills," which DESIGN.md's rule was
  written for badges/status chips, not destructive-confirm buttons).
- Sizes: `sm` / `md` (default) / `lg`.
- Icon slot: `icon?: LucideIcon` prop, left-aligned with `gap-2`, matching
  existing `lucide-react` usage already in the codebase (don't introduce
  Material Symbols — the Stitch mocks use Google's Material Symbols font via
  a CDN link, but this app already has `lucide-react` installed and in use
  everywhere; keep lucide-react, do not add a second icon system).

### 7.2 Card

**Current state:** no `Card.tsx`. Every card is inline
`bg-white p-6 rounded-xl border dark:bg-zinc-900 dark:border-zinc-800` (stat
cards on dashboard), or `bg-white rounded-xl border overflow-hidden ...`
(Reminders/Engagement panels) — same shape, duplicated per page, dark-mode
variant baked in per-instance.

**Target:** extract `src/components/ui/Card.tsx` as a thin wrapper applying
`.glass-card` + `rounded-xl` + a `padding` prop (`none | sm | md | lg` →
`p-0 | p-4 | p-6 | p-8`), optional `<Card.Header>`/`<Card.Body>`/`<Card.Footer>`
sub-parts matching the recurring "header bar with bottom border + title +
optional action link" shape seen in the Reminders/Engagement/Attention
Registry cards (`px-6 py-4 border-b ... flex justify-between items-center`).
This single component replaces at least 6 duplicated inline card shells
visible in `src/app/page.tsx` alone.

### 7.3 Badge

**Current state:** no `Badge.tsx`. Inline status pills exist in two flavors
already: task priority (`inline-flex items-center rounded-full px-2.5 py-0.5
text-xs font-semibold` + conditional `bg-red-100 text-red-800` /
`bg-blue-100 text-blue-800`) and engagement score (`bg-red-100 text-red-800`
fixed). `RelationshipStatusSelect.tsx` likely renders its own status
indicator too (not read in full, but referenced from `donors/page.tsx`)  —
worth checking during implementation whether it already half-matches this
spec.

**Target:** extract `src/components/ui/Badge.tsx` with a `status` prop driving
the semantic scale in §2 (`success | warning | error | info | neutral`),
rendering `rounded-full px-3 py-1 text-[11px] font-bold uppercase
tracking-widest border` per the donor-management mock's exact pattern (that
mock's badge styling is the most fully-realized status-chip example across
the whole export — use it as the literal reference, not the simpler dashboard
version). Map existing status values to it:
- Donor/Church `relationship_status` "Active"-equivalent → `success`
- "Lead"/prospecting stages → `info`
- "Lapsed"/cold → `error`
- Task priority "High" → `error`-toned but keep distinct wording (priority
  isn't quite the same semantic axis as status — consider a separate
  `priority` variant if this gets confusing in practice, flag during build
  rather than force-fitting).

### 7.4 StatCard

**Current state:** no `StatCard.tsx`. The dashboard's 5-stat grid
(`src/app/page.tsx` lines ~196–210) is the clearest existing example: each
card is `bg-white p-6 rounded-xl border` with an icon in a tinted rounded
square, a label, and a value.

**Target:** extract `src/components/ui/StatCard.tsx`. Target shape per the
Stitch mocks' metrics-grid pattern (dashboard's "Active Donors" card and
donor-management's "Total Donors" card): `.glass-card p-md`, icon in a
`bg-primary-container/10 text-primary` rounded square (top-left), an optional
trend indicator top-right (`+5.2%` in `text-primary` or `text-green-600`),
label in `label-sm uppercase tracking-wider text-on-surface-variant`, value in
`headline-md font-bold text-on-surface` (note: NOT `headline-lg` — that's
reserved for page titles; stat values use the smaller headline size, per the
dashboard mock literally using `font-headline-md` on its stat values). Props:
`label`, `value`, `icon`, `trend?`, `progress?` (0–100, renders the thin
progress bar variant seen on "Budget Progress" and "Annual Giving Goal").

### 7.5 Sidebar

**Current state:** `src/components/Sidebar.tsx` exists (only shared nav
component in the app today) — `w-64`, white bg, `border-r`, blue active-state
(`bg-blue-50 text-blue-700`), zinc hover states, dark-mode variants
throughout, Heart icon + "Mission CRM" wordmark, uses `lucide-react` icons
already matching the nav item list 1:1 with the Stitch sidebar (Dashboard,
Donors, Churches, Language Schools, Projects, Tasks, Inventory, Budget,
Calendar — literally the same 9 items, same order).

**Target:** restyle in place (same file, same structure/props — this is a
retheme, not a rebuild, since the nav-item list and behavior are already
correct):
- Background → `paper-neutral` (`#F5EFEF`), not white.
- Active item → `text-primary font-bold bg-surface-container-high rounded-xl`
  (replaces `bg-blue-50 text-blue-700`).
- Inactive/hover → `text-secondary hover:bg-surface-container` (replaces
  zinc).
- Border → `border-outline-variant` (replaces plain `border`/zinc-800).
- Brand mark: mocks show a circular logo image + "Light in the East" in
  Playfair + "Mission CRM" uppercase small-caps subtitle underneath, replacing
  the current Heart-icon + single-line wordmark. **Flag for Roman:** does a
  real "Light in the East" logo image exist to drop in, or should this stay
  icon-based (e.g. keep `Heart` or swap to a more fitting lucide icon) for
  now? Recommend keeping it icon-based (no placeholder image asset) until a
  real logo file is provided, rather than linking the mock's placeholder
  Google-hosted image URL into production.
- Sign-out / Settings footer links: keep current structure, apply
  `text-secondary hover:bg-surface-container` treatment.
- Mobile bottom nav (fixed bar, 4 items: Home/Donors/Tasks/Budget) does NOT
  exist in the current app at all — this is new work, not a retheme. Confirm
  whether it's in scope for this design pass or deferred; DESIGN.md documents
  it as part of the system, so recommend building it alongside the Sidebar
  restyle (same PR/task), using `bg-white border-t border-outline-variant
  fixed bottom-0 lg:hidden`, replacing the sidebar below the `lg` breakpoint
  — the current app has no mobile nav fallback at all today (sidebar is
  always rendered, `w-64` fixed, no responsive collapse), so this is a real
  gap being closed, not a cosmetic swap.

### 7.6 Input

**Current state:** no `Input.tsx`. Every form field is inline
`w-full px-3 py-2 border rounded-lg dark:bg-zinc-950 dark:border-zinc-800
outline-none focus:ring-2 focus:ring-blue-500` (see `donors/new/page.tsx`,
repeated ~8 times in that one file for text/email/select fields, textarea
gets `h-24` appended).

**Target:** extract `src/components/ui/Input.tsx` (+ `Select.tsx`,
`Textarea.tsx` siblings, or one `Field` wrapper handling all three via a
`as` prop — implementation detail for the Code Agent to decide, not
prescribing file count here). Two real style options surfaced across the
mocks, and they're genuinely different, not just a detail:

1. **Bordered box style** (top-level search bars): `bg-paper-neutral
   border-none rounded-full focus:ring-2 focus:ring-primary-container/20` —
   pill-shaped, used for global/quick search only.
2. **Underline style** (all form fields, seen in the budget "New Entry" form):
   `bg-paper-neutral border-0 border-b border-outline-variant py-3 px-2
   focus:border-primary-container` — no side borders, no rounding, just a
   bottom rule that highlights terracotta on focus.

**Recommendation:** adopt the underline style (#2) as the standard `Input`/
`Select`/`Textarea` for all data-entry forms (donor/church/project/task/
budget new+edit) — it's the more distinctive, editorial choice consistent
with the serif-headline identity, and it's what the one actual form mock in
the export (`new_budget_entry_unified_layout`) uses throughout. Reserve the
pill/rounded style (#1) for search inputs only, matching how the mocks use it
exclusively in header search bars and the donor-list filter bar. Apply the
§6 focus-ring floor on top of the mock's own `focus:border-primary-container`
(the border-color change alone isn't enough of a non-color focus signal for
users who can't perceive the color shift).

---

## 8. Things flagged rather than improvised (per DESIGN.md's own instruction)

1. **Glass-card definition conflict across the Stitch export itself** — see
   §5. Resolved by recommendation (true blur/translucency), but this is a
   judgment call on inconsistent source material, not a clean port — needs a
   yes from Roman before the Code Agent treats it as settled.
2. **Secondary-button color: DESIGN.md says navy outline, every actual mock
   instance uses terracotta outline** — see §7.1. Recommending mocks-over-
   prose; flag before building in case DESIGN.md's navy call was intentional
   and the mocks just didn't get updated to match.
3. **Dark mode is NOT addressed anywhere in DESIGN.md or the Stitch export**
   — every mock is `class="light"` only, no `dark:` variants exist in any
   `code.html` I read, and DESIGN.md's palette table has no dark-mode column.
   The CURRENT app, by contrast, has `dark:` classes throughout (layout shell,
   Sidebar, every page read). **Decision needed from Roman:** (a) drop dark
   mode entirely for this redesign (simplest — matches the actual approved
   design system, which is light-only by every available reference), (b)
   defer dark mode to a later phase and ship light-only now without ripping
   out the `dark:` classes (leaves dead/unstyled dark-mode code paths lying
   around, not recommended), or (c) have the Code Agent invent a parallel
   dark palette matching the terracotta/cream identity (real design work
   DESIGN.md never asked for or approved — should not happen without an
   explicit go-ahead, since "flag rather than improvise" applies directly
   here). **Recommendation: (a), drop dark mode for this pass** — cleanest,
   matches what was actually designed and approved, and avoids inventing an
   unreviewed second palette. Whoever approves this spec should pick
   explicitly rather than let the Code Agent default silently.
4. **Button/input radius:** DESIGN.md's literal spec (8px) reads slightly
   tighter than what's actually rendered across every button in the mocks —
   see §4. Standardized on `lg` (12px) for buttons, kept 8px for inputs.
   Minor, flagging for completeness rather than blocking on it.
5. **`error` token (`#ba1a1a`) from DESIGN.md's table never appears in any
   Stitch Tailwind config I opened** — the mocks use plain Tailwind `red-*`
   utilities for error/overdue states instead. Recommend NOT adding `error`
   as a custom `@theme` token (it would go unused / risk drifting from the
   red-100/red-800/red-600 pattern that's actually used everywhere); keep
   error states on stock Tailwind red utilities per §2's semantic scale table.
6. **`margin-safe` spacing token** appears once (donor-management page's
   `<main>` padding, 32px) and is numerically identical to `xl`. Recommend
   folding it into `xl`, not shipping a near-duplicate token — flagging in
   case there was an intentional distinction (e.g. "safe area" semantics for
   some future mobile use) that just isn't visible from a single instance.
7. **Mobile bottom nav is entirely new functionality**, not a restyle of
   anything existing — see §7.5. Confirm it's in scope for this pass.
8. **Material Symbols vs. lucide-react:** the Stitch mocks use Google's
   Material Symbols Outlined font throughout; this codebase already uses
   `lucide-react` everywhere with no Material Symbols dependency. Recommend
   keeping `lucide-react` exclusively and mapping each Material Symbol name
   used in the mocks to its nearest lucide equivalent during page-level
   implementation (not part of this spec's job to produce that full mapping
   table, but noting it so the Code Agent doesn't try to add a second icon
   font).
9. **Playfair Display `headline-md` weight mismatch:** the Stitch
   `fontSize` config declares `headline-md` at weight 500, but every actual
   headline-md usage I saw in the markup pairs it with an explicit
   `font-bold` class. Spec'd 600 as the practical default in §3; flagging the
   source inconsistency rather than silently picking one.

---

## 9. Rollout order

**Phase 0 — Foundations (this must land first, nothing else should start
before it):**
1. `globals.css` — full `@theme` token block (colors, fonts, spacing, radius),
   `.glass-card` utility, focus-ring utility if extracted as a class.
   Dark-mode handling per whatever Roman picks in §8.3.
2. `layout.tsx` — swap Geist → Playfair Display + Inter via `next/font/google`,
   remove `dark:` shell classes if dark mode is dropped, set `background`
   body class.
3. Extract the six shared primitives in §7 (Button, Card, Badge, StatCard,
   Input/Select/Textarea) as real component files under
   `src/components/ui/`. Restyle `Sidebar.tsx` in place.
4. **Do not touch any page yet.** Foundations get reviewed/approved on their
   own (e.g. a throwaway style-guide route, or just visual review of the
   components in isolation) before step-2 below starts, per DESIGN.md's
   explicit instruction to verify on one real page before rolling out further
   — but the "one real page" is itself Phase 1, not part of foundations.

**Phase 1 — One proven page end-to-end: the Dashboard (`src/app/page.tsx`).**
Justification against the actual page list, not a default pick: the dashboard
is the only page that exercises StatCard, Card (two variants — list-style
Reminders/Engagement panels AND the metrics grid), Badge (priority + status +
engagement score chips), the quote/identity block (unique to this page, no
other page has it, so it must be proven here or not at all), AND the Sidebar
in its most-visible context (always-visible on every page, but the dashboard
is the first thing every session sees). No other single page touches this
many primitives at once — donor list, for comparison, only exercises Card,
Badge, and a table (no StatCard variety, no quote block). Rebuilding the
dashboard first means every subsequent page reuses already-battle-tested
components instead of the first attempt at each one being buried inside a
list or profile page.

**Phase 2 — List-type pages together** (Donors, Churches, Language Schools,
Projects, Tasks list views, Inventory list): share the same table +
search-bar + filter-bar + Badge + pagination shape almost exactly (confirmed
by reading the donor-management mock's table structure — status badge,
progress-bar-in-cell for engagement score, avatar-initial circles, hover row
state, `more_vert` row action). Doing these together, right after the
dashboard, means the table pattern gets extracted/reused once instead of
five times independently.

**Phase 3 — Profile/detail pages together** (Donor, Church, Project,
Language School, Task profile, Publication profile): share a different
shape — header card with identity + status + key stats, then stacked content
sections (contact log, notes, gift history). Doing these as a batch after
lists means the "detail page shell" pattern (if one emerges) also gets
extracted once.

**Phase 4 — Forms/Budget last:** New/Edit forms across every entity, plus
Budget overview + new-entry. Justification for going last: forms are the
one place with a genuinely different input treatment (underline style, §7.6)
that doesn't reuse anything from Phases 1–3, and Budget specifically is the
one area with real internal inconsistency in the source mocks (primary vs.
primary-container button fill, §8) that benefits from the Button component
already being settled and battle-tested by the time it's built, rather than
re-litigating button color while also building the form layout.

**Phase 5 — Calendar, remaining one-offs** (Calendar month-grid, any page not
cleanly bucketed above): last, since Calendar's grid layout is genuinely
unique among the 16 mocks and shares the least with any other page.

This order deliberately does NOT enumerate all pages as equal-weight
independent items — grouping by shape (list / profile / form) is the point,
so each group amortizes one round of pattern-proving across several pages
instead of relitigating per page.

---

## 10. Accessibility floor checklist (non-negotiable regardless of aesthetic)

- [ ] WCAG AA contrast verified for: `on-surface-variant` (#55423d) on
      `background`/`surface`/`paper-neutral`, `primary` (#9b4426) on white,
      `on-primary` (#ffffff) on `primary` fill, all badge text/background
      pairs in §2. `on-surface-variant`'s warm brown-gray against `paper-neutral`
      (#F5EFEF) is the pairing most worth double-checking with a contrast tool
      during build — it's close enough visually that it needs verifying, not
      assuming.
- [ ] Visible keyboard focus state on every interactive element — see §6's
      `focus-visible` ring spec, applied via the shared components so it
      isn't re-implemented per page.
- [ ] `prefers-reduced-motion` respected for the `.glass-card` hover lift and
      any other transform/transition added (see §5's media query).
- [ ] No neon, no dark-by-default, no AI-purple/pink gradients — confirmed
      clean; the whole point of Soft Luminous is the opposite of that
      aesthetic, and nothing in this spec introduces it.
- [ ] Calm/clinical tone maintained even where the mocks lean "editorial
      premium" — this is a mission-org CRM handling donor PII, not a
      marketing site; the serif headlines and quote-block are the one
      permitted "warmth" touch per DESIGN.md, not a license to add more
      decorative elements later without going back through this same review.

---

## 11. What this spec deliberately does NOT do

- Does not write or modify any `.tsx`/`.css` file.
- Does not touch `PROJECT_STATE.md` (Director-owned).
- Does not resolve the four flagged items in §8 — those need Roman's input,
  not a Designer-role guess, before Phase 0 starts.
- Does not produce the full Material-Symbols → lucide-react icon mapping
  table (implementation detail, not a design decision — leave to the Code
  Agent during Phase 1).

**STOP HERE.** Awaiting Director/Roman approval before any Phase 0 work
begins.
