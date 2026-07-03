---
name: Soft Luminous
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#55423d'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#89726b'
  outline-variant: '#dcc1b9'
  surface-tint: '#9b4426'
  primary: '#9b4426'
  on-primary: '#ffffff'
  primary-container: '#e27b58'
  on-primary-container: '#5c1800'
  inverse-primary: '#ffb59d'
  secondary: '#515f74'
  on-secondary: '#ffffff'
  secondary-container: '#d5e3fc'
  on-secondary-container: '#57657a'
  tertiary: '#516072'
  on-tertiary: '#ffffff'
  tertiary-container: '#8a99ae'
  on-tertiary-container: '#233142'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd0'
  primary-fixed-dim: '#ffb59d'
  on-primary-fixed: '#390c00'
  on-primary-fixed-variant: '#7c2e11'
  secondary-fixed: '#d5e3fc'
  secondary-fixed-dim: '#b9c7df'
  on-secondary-fixed: '#0d1c2e'
  on-secondary-fixed-variant: '#3a485b'
  tertiary-fixed: '#d4e4fa'
  tertiary-fixed-dim: '#b9c8de'
  on-tertiary-fixed: '#0d1c2d'
  on-tertiary-fixed-variant: '#39485a'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  headline-xl:
    fontFamily: Playfair Display
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Playfair Display
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-lg-mobile:
    fontFamily: Playfair Display
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Playfair Display
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.02em
  data-mono:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
---

## Brand & Style
The design system focuses on a "Soft Luminous" aesthetic, blending the intellectual heritage of editorial design with the functional clarity of a modern CRM. It evokes a sense of calm productivity, warmth, and high-end craftsmanship.

The style is **Minimalist with Tactile warmth**. It prioritizes generous whitespace, sophisticated color transitions, and a refined typographic hierarchy. The goal is to reduce cognitive load for users managing complex data by providing a "paper-like" digital environment that feels premium and intentional.

## Colors
The palette is anchored by a warm, off-white surface that mimics high-quality stationery, reducing eye strain during prolonged use.

- **Primary (Terracotta):** A muted sunset orange used for primary actions and brand presence. It provides warmth without the aggression of high-saturation oranges.
- **Neutral (Slate Navy):** A deep charcoal-navy is used for all primary text and iconography to ensure high legibility while maintaining a softer contrast than pure black.
- **Surface:** The background uses a creamy ivory tint to create a sense of depth and luxury.
- **Accents:** Use subtle variations of the secondary slate for borders and dividers to maintain a cohesive, low-friction visual field.

## Typography
This design system employs a dual-typeface strategy to balance editorial elegance with functional utility.

- **Headlines:** Playfair Display is reserved for page titles, section headers, and high-level summaries. Its high contrast and classic serifs provide the "Literary" feel.
- **UI & Data:** Inter is used for all functional elements, including labels, inputs, navigation, and body text. 
- **Data Rendering:** When displaying numerical data or CRM records, utilize Inter with tabular lining figures (`tnum`) to ensure columns of numbers align perfectly for easy scanning.

## Layout & Spacing
The layout follows a **Fixed Grid** philosophy for desktop to maintain the readability of an editorial spread, transitioning to a fluid model for mobile.

- **Desktop:** 12-column grid with a 1280px max-width. Use 24px gutters to allow the content "breathable" space.
- **Vertical Rhythm:** Use increments of 8px (2 units) for most component spacing. Use 40px (5 units) to separate major sections.
- **Alignment:** Content should be primarily left-aligned to mirror traditional manuscript layouts, with significant margins on either side of the main content column to focus the user's eye.

## Elevation & Depth
Depth is created through **Tonal Layers** rather than heavy shadows. This maintains the "Soft" characteristic of the design system.

- **Level 0 (Base):** The #fff8f6 cream surface.
- **Level 1 (Cards/Panels):** Pure white (#ffffff) surfaces with a very soft, 12% opacity Terracotta-tinted shadow (e.g., 0px 4px 20px rgba(226, 123, 88, 0.08)).
- **Level 2 (Dropdowns/Modals):** Pure white with a slightly more defined Navy-tinted shadow to provide separation from the background.
- **Dividers:** Use 1px solid lines in #e2e8f0 (very light slate) to define boundaries without adding visual weight.

## Shapes
The shape language is consistently **Rounded**, avoiding sharp edges to maintain an approachable and organic feel.

- **Buttons & Inputs:** Use 0.5rem (8px) corner radius.
- **Cards & Modals:** Use 1rem (16px) corner radius for a softer, containerized look.
- **Search Bars:** May use a pill-shape (3) to distinguish them from standard text fields and emphasize their role as a primary utility.

## Components
- **Buttons:** Primary buttons use the Terracotta fill with white text. Secondary buttons use a Navy outline with a transparent background. Action text is always Inter Bold.
- **Inputs:** Fields should have a subtle off-white fill (slightly darker than the background) and a 1px border that darkens on focus.
- **Chips/Tags:** Used for CRM status or categories. Use a low-saturation version of the primary color with dark Navy text to ensure readability.
- **Cards:** Cards should feature a 1px border in a very light neutral tone and the soft Terracotta-tinted shadow mentioned in the Elevation section.
- **Lists:** Data rows should have generous vertical padding (16px) and subtle hover states using a 2% opacity Navy overlay.
- **Iconography:** Use "Light" or "Regular" weight line icons to match the stroke weight of the Inter typeface.