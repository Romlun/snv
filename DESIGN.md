# DESIGN.md — snv Mission CRM Visual Design System

**"Soft Luminous"** — provenance: generated via Stitch from the live production
app (snv-zeta.vercel.app), reviewed by the Director against two earlier
options (a GPT-generated redesign, and Claude Design's output). Chosen because
it's genuinely distinctive without being overwhelming — the GPT version used
one accent color for nearly everything and became visually noisy; Claude
Design's stayed too close to the current app to represent a real refresh.
This system solves both: one warm accent used sparingly, calm whitespace,
and a real point of view (editorial serif headlines + functional sans data).

Reference material (full Stitch export — 16 pages, static HTML + screenshots)
lives alongside this file at `design/stitch-export/`, so the Designer
subagent and Code Agent can see the actual mocked pages, not just this
token summary.

---

## Brand & Style

Minimalist with tactile warmth. Generous whitespace, sophisticated tonal
color transitions, refined typographic hierarchy — a "paper-like" digital
environment that reduces cognitive load for a team managing complex donor/
church/project data all day. Premium and intentional, not sterile.

## Colors

Primary reference palette (from the chosen "Soft Luminous" variant):

| Token | Hex | Use |
|---|---|---|
| `primary` (terracotta) | `#9b4426` | Primary actions, brand accents — used SPARINGLY, not on every element |
| `on-primary` | `#ffffff` | Text/icons on primary fill |
| `primary-container` | `#e27b58` | Lighter primary, hover/secondary emphasis |
| `secondary` (slate navy) | `#515f74` | Secondary actions, less-prominent UI |
| `surface` (background) | `#f9f9ff` / `#fff8f6` | Page background — creamy, not pure white |
| `surface-container-lowest` | `#ffffff` | Cards/panels — pure white against the cream page |
| `on-surface` (primary text) | `#111c2d` | Body text, headings — soft near-black, not pure black |
| `on-surface-variant` | `#55423d` | Secondary/muted text |
| `outline-variant` | `#dcc1b9` | Borders, dividers — light, low-contrast |
| `error` | `#ba1a1a` | Overdue/error states |

Two closely-related variants exist in the source ("Soft Luminous" — cooler,
more neutral cream; "Luminous Literary" — warmer, more peach-toned). Soft
Luminous is the one actually used across the 15 mocked pages — treat it as
canonical unless the operator says otherwise.

## Typography

Dual-typeface: **Playfair Display** (serif) for headlines and page titles
only — gives the editorial/premium feel. **Inter** for everything functional:
labels, body text, data, navigation, inputs. Never use Playfair for anything
a user needs to scan quickly (table data, form labels) — it's for the handful
of large headings per page, not general UI text.

- headline-xl: Playfair 48px/700
- headline-lg: Playfair 32px/600
- headline-md: Playfair 24px/600
- body-lg / body-md: Inter 18px / 16px, 400
- label-md / label-sm: Inter 14px / 12px, 600 / 500
- Numeric/data columns: Inter with tabular figures (`tnum`) so numbers align

## Layout & Spacing

- 12-column grid, 1280px max content width, 24px gutters
- 8px vertical rhythm for component spacing; 40px between major sections
- Left-aligned content, generous margins — not centered/boxed
- Cards: 16px border radius. Buttons/inputs: 8px. Search bars: pill (full)

## Elevation

Tonal layers, not heavy drop-shadows — this is central to the "soft" feel.

**Correction (verified against the actual code, not just the written system
doc):** cards are NOT pure white. They use a frosted-glass treatment:
```css
.glass-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(137, 114, 107, 0.15);
}
```
This applies to stat cards, the attention-list panel, and sidebar panels —
it's a deliberate, consistent effect, not incidental. The top header bar
uses the same idea (`bg-white/80 backdrop-blur-md`). Port this as an actual
`backdrop-filter` utility, not a flat white background.

- Level 0 (page): cream surface (`#fff8f6`)
- Level 1 (cards): `.glass-card` as above, PLUS a hover lift — on hover,
  translateY(-2px) and a soft terracotta shadow fades in
  (`0 12px 30px -10px rgba(155, 68, 38, 0.12)`). This is done with a few
  lines of JS in the mockup (mouseenter/mouseleave), but a CSS `:hover`
  transition achieves the same thing more simply — no need to port the JS
  approach, just the visual effect.
- Level 2 (modals/dropdowns): white, slightly more defined navy-tinted shadow
- Dividers: 1px solid, very light neutral — never a heavy border

## Components

- **Buttons:** primary = terracotta fill, white text. Secondary = navy
  outline, transparent fill. Never more than one primary-filled button
  visible at once on a given screen — that's what keeps the accent color
  meaningful instead of overwhelming (this was the specific failure mode of
  the rejected GPT version).
- **Cards:** white, 1px light border, soft tinted shadow, 16px radius
- **Status badges/chips:** low-saturation version of a status color with
  dark navy text — not full-saturation fills
- **Lists/tables:** generous 16px vertical row padding, subtle 2%-opacity
  hover state
- **Icons:** light/regular-weight line icons, matching Inter's stroke weight
- **Identity/quote block:** a full-width footer accent seen on the dashboard
  mock — thin terracotta top border, large translucent quote-mark icon,
  serif italic scripture quote, small-caps citation below. A tasteful,
  low-cost identity touch appropriate for this mission org (unlike the
  rejected GPT version's decorative illustration, this is small, text-based,
  and doesn't compete with the actual data above it). Worth keeping as a
  reusable component, not just a one-off on the dashboard.
- **Mobile nav:** a fixed bottom bar (4 items: Home/Donors/Tasks/Budget)
  replaces the sidebar below the `lg` breakpoint in the mock — confirms
  responsive behavior was considered, not just a desktop-only mock.

---

## Implementation notes (for the Code Agent, not general design guidance)

1. **This codebase runs Tailwind v4** (CSS-first `@theme` config), but the
   Stitch export's `tailwind.config` block is written v3-style (JS
   `theme.extend`). Do NOT copy that config object directly — translate the
   tokens above into the project's global CSS `@theme` block instead, e.g.:
   ```css
   @theme {
     --color-primary: #9b4426;
     --color-surface: #f9f9ff;
     --color-on-surface: #111c2d;
     --font-headline: "Playfair Display", serif;
     --font-body: "Inter", sans-serif;
   }
   ```
   (illustrative — the Code Agent should port the full token set, not just
   these examples).
2. **Foundations before pages.** Update shared UI primitives first — Button,
   Card, Badge, StatCard, Sidebar, Input — and verify those look right on
   ONE real page before rolling out further. Copying each of the 15 mocked
   pages individually will produce visible inconsistency (15 slightly
   different buttons) instead of one shared system.
3. **The 15 Stitch pages are reference, not literal source.** They use
   placeholder/sample data (donor names, church names) that won't match
   real records — implement the STYLE against real live data, not by
   copying the mocked content.
4. Reuse this system exactly as documented above — this file, not the
   Code Agent's own judgment, is the source of truth for colors/type/
   spacing on this pass. Flag to the Director if something in here doesn't
   translate cleanly to an existing page, rather than improvising a
   variant.
