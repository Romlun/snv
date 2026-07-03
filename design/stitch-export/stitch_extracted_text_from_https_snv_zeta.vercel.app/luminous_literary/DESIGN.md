---
name: Luminous Literary
colors:
  surface: '#fff8f6'
  surface-dim: '#edd5cb'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1eb'
  surface-container: '#ffeae0'
  surface-container-high: '#fce3d9'
  surface-container-highest: '#f6ded3'
  on-surface: '#251913'
  on-surface-variant: '#584237'
  inverse-surface: '#3c2d26'
  inverse-on-surface: '#ffede6'
  outline: '#8c7164'
  outline-variant: '#e0c0b1'
  surface-tint: '#9d4300'
  primary: '#9d4300'
  on-primary: '#ffffff'
  primary-container: '#f97316'
  on-primary-container: '#582200'
  inverse-primary: '#ffb690'
  secondary: '#545f73'
  on-secondary: '#ffffff'
  secondary-container: '#d5e0f8'
  on-secondary-container: '#586377'
  tertiary: '#006398'
  on-tertiary: '#ffffff'
  tertiary-container: '#00a2f4'
  on-tertiary-container: '#003554'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbca'
  primary-fixed-dim: '#ffb690'
  on-primary-fixed: '#341100'
  on-primary-fixed-variant: '#783200'
  secondary-fixed: '#d8e3fb'
  secondary-fixed-dim: '#bcc7de'
  on-secondary-fixed: '#111c2d'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#cde5ff'
  tertiary-fixed-dim: '#93ccff'
  on-tertiary-fixed: '#001d32'
  on-tertiary-fixed-variant: '#004b74'
  background: '#fff8f6'
  on-background: '#251913'
  surface-variant: '#f6ded3'
  warm-surface: '#FDFCFB'
  paper-neutral: '#F5EFEF'
  sunset-gold: '#FB923C'
  ink-black: '#0F172A'
typography:
  display-lg:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
  body-lg:
    fontFamily: Source Serif 4
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Source Serif 4
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Work Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Work Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  gutter: 24px
  margin-safe: 32px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

This design system is built on the pillars of enlightenment, intellectual warmth, and organizational clarity. It targets an audience that values deep reading, historical perspective, and mission-driven work. The visual language evokes the "golden hour"—a moment of transition and clarity—balancing the tradition of literary publishing with the efficiency of modern CRM tools.

The aesthetic follows a **Minimalist / Editorial** direction. It prioritizes generous negative space (white space) to reduce cognitive load, paired with high-quality serif typography that commands respect and ensures long-form legibility. The interface feels light and airy, avoiding heavy containers in favor of structural grid alignment and subtle tonal shifts.

## Colors

The palette is anchored by a vibrant "Sunrise Orange" (#F97316), derived from the brand’s core iconography. This primary color is used sparingly for high-intent actions and critical status indicators to maintain its impact.

The background system utilizes a "Warm Surface" approach rather than pure clinical white. By using #FDFCFB and #F5EFEF for containers, the UI mimics the physical qualities of paper, reducing eye strain for literary consumption. Secondary and neutral tones are pulled from deep slate and ink-like blacks to provide a strong grounding for typography, ensuring maximum contrast and professional authority.

## Typography

This system employs a sophisticated tri-font pairing to distinguish between narrative, utility, and hierarchy.

- **Display & Headlines:** *Playfair Display* is used for high-level branding and section headers. Its high-contrast serifs reflect the literary heritage of the product.
- **Body & Long-form:** *Source Serif 4* is selected for all reading-intensive content. It offers exceptional legibility at small sizes while maintaining a scholarly character.
- **UI & Labels:** *Work Sans* provides a neutral, modern contrast for buttons, navigation, and data labels, ensuring the CRM's functional elements are clearly distinguished from its literary content.

## Layout & Spacing

The layout utilizes a **Fixed Grid** system for desktop (1280px max-width) to maintain a readable line length for literary text. A 12-column grid is used with 24px gutters.

The spacing rhythm is intentional and generous. To maintain the "airy" feel, the system uses a 4px baseline unit, with standard component padding favoring larger values (16px and 24px). 

**Breakpoints:**
- **Desktop (1024px+):** 12 columns, 32px safe margins.
- **Tablet (768px - 1023px):** 8 columns, 24px safe margins.
- **Mobile (<767px):** 4 columns, 16px safe margins. Body text size remains constant, but display headers scale down to avoid awkward line breaks.

## Elevation & Depth

To maintain a clean, literary aesthetic, the system avoids heavy shadows. Depth is communicated through **Tonal Layers** and **Low-Contrast Outlines**.

- **Level 0 (Background):** The warm surface (#FDFCFB).
- **Level 1 (Cards/Containers):** Defined by a 1px border (#E2E8F0) or a slight shift to the neutral paper tone (#F5EFEF).
- **Level 2 (Dropdowns/Modals):** A very soft, highly diffused ambient shadow (Color: Primary tint, 4% opacity, 20px blur) is used to indicate temporary elevation without breaking the flat editorial feel.

## Shapes

The shape language is **Soft (Level 1)**. Elements like input fields and standard buttons use a 0.25rem (4px) corner radius. This provides a professional, "tailored" appearance that feels more precise and structured than fully rounded pill shapes, fitting the serious nature of a CRM and literary platform.

Larger cards or featured content blocks may use `rounded-lg` (8px) to provide a gentle, approachable frame for imagery.

## Components

- **Buttons:** Primary buttons use the brand orange (#F97316) with white text. Secondary buttons use a slate-ink outline with no fill. All buttons utilize *Work Sans* for maximum clarity.
- **Input Fields:** Use a subtle "Paper" fill (#F5EFEF) with a bottom-only border that transitions to a full border on focus. This mimics the appearance of a lined notebook.
- **Cards:** Cards are borderless with a very light neutral background. They rely on the grid and consistent typography to define their boundaries rather than heavy drop shadows.
- **Chips/Tags:** Used for categorizing literary genres or donor segments. They should be rectangular with small 2px corners, using low-saturation versions of the primary color to avoid distracting from the main text.
- **Lists:** CRM lists should feature generous 16px vertical padding between rows to maintain the airy, readable feel of a table of contents.