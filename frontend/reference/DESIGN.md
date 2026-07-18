---
name: Cyber Manga Professional
colors:
  surface: '#081425'
  surface-dim: '#081425'
  surface-bright: '#2f3a4c'
  surface-container-lowest: '#040e1f'
  surface-container-low: '#111c2d'
  surface-container: '#152031'
  surface-container-high: '#1f2a3c'
  surface-container-highest: '#2a3548'
  on-surface: '#d8e3fb'
  on-surface-variant: '#cbc3d7'
  inverse-surface: '#d8e3fb'
  inverse-on-surface: '#263143'
  outline: '#958ea0'
  outline-variant: '#494454'
  surface-tint: '#d0bcff'
  primary: '#d0bcff'
  on-primary: '#3c0091'
  primary-container: '#a078ff'
  on-primary-container: '#340080'
  inverse-primary: '#6d3bd7'
  secondary: '#adc6ff'
  on-secondary: '#002e6a'
  secondary-container: '#0566d9'
  on-secondary-container: '#e6ecff'
  tertiary: '#bec6e0'
  on-tertiary: '#283044'
  tertiary-container: '#8990a8'
  on-tertiary-container: '#22293d'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e9ddff'
  primary-fixed-dim: '#d0bcff'
  on-primary-fixed: '#23005c'
  on-primary-fixed-variant: '#5516be'
  secondary-fixed: '#d8e2ff'
  secondary-fixed-dim: '#adc6ff'
  on-secondary-fixed: '#001a42'
  on-secondary-fixed-variant: '#004395'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#081425'
  on-background: '#d8e3fb'
  surface-variant: '#2a3548'
typography:
  display:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.05em
  code:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  gutter: 16px
  sidebar-width: 280px
  chat-max-width: 800px
---

## Brand & Style

The design system is engineered for a high-performance AI anime assistant, blending the precision of a professional developer tool with the vibrant energy of modern Japanese pop culture. The brand personality is "Expert Otaku"—intelligent, fast, and deeply immersed in the medium.

The aesthetic follows a **Modern Corporate** foundation infused with **Subtle Manga accents**. This is achieved through high-contrast typography, surgical precision in layout, and the strategic use of halftone patterns and "speed-line" inspired dividers. The user interface should feel like a premium command center: dark, immersive, and incredibly responsive.

**Key Stylistic Pillars:**
- **Cinematic Depth:** Utilizing deep navy gradients to create a sense of infinite space.
- **Manga Texture:** Subtle 15% opacity halftone patterns used as background fills for secondary containers.
- **Functional Precision:** Heavy reliance on systematic spacing and clear information hierarchy to ensure the "pro tool" experience.

## Colors

This design system utilizes a high-contrast dark palette designed for long-form browsing and focused chat interactions.

- **Primary (#8B5CF6):** Used for primary actions, active states, and AI-driven highlights.
- **Secondary (#3B82F6):** Used for secondary links, category tags, and subtle "processing" indicators.
- **Background Tiers:** 
  - `Base`: #0F172A (Deep Navy) for the overall application canvas.
  - `Surface`: #1E293B (Charcoal) for structural elements like sidebars and headers.
  - `Elevated`: #334155 (Slate) for interactive components like cards and chat bubbles.
- **Typography:** Headings utilize pure white (#FFFFFF) for maximum legibility, while body copy uses #E2E8F0 (Slate-200) to reduce eye strain during extended reading.

## Typography

The design system uses **Geist** for its technical, precise feel that reinforces the "AI assistant" narrative. 

- **Headlines:** Use Bold and SemiBold weights with tight letter-spacing to mimic editorial manga titles.
- **Body:** Standardized at 16px for readability, using the Regular weight. 
- **Labels:** Small caps or uppercase with increased tracking (letter-spacing) are used for metadata like "Score," "Genre," or "Status" to provide a data-rich appearance without cluttering the view.
- **Line Heights:** Generous line heights are applied to body copy to ensure that even dense anime synopses remain approachable.

## Layout & Spacing

The layout follows a **Fixed Sidebar + Fluid Content** model. The interface is optimized for a centered chat experience on desktop, while maintaining a dense grid for search results.

- **Grid:** A 12-column grid is used for the main content area.
- **Breakpoints:**
  - `Mobile (<768px)`: Sidebar collapses into a bottom navigation bar or a hamburger menu. Margins reduce to 16px.
  - `Desktop (>768px)`: Fixed sidebar (280px). Content area uses a max-width of 1200px for search results and 800px for chat threads.
- **Rhythm:** Spacing is strictly based on a 4px scale. Most components use 16px (4 units) or 24px (6 units) of internal padding to maintain a breathable, "pro" feel.

## Elevation & Depth

This design system avoids traditional heavy shadows in favor of **Tonal Layering** and **Subtle Outlines**.

- **Layer 0 (Base):** Deep Navy (#0F172A).
- **Layer 1 (Sidebar/Header):** Charcoal (#1E293B) with a 1px solid border (#334155) on the leading or trailing edge.
- **Layer 2 (Cards/Bubbles):** Slate (#334155). 
- **Accents:** Use a 1px "inner-glow" border for active elements using the primary color at 30% opacity.
- **Manga Texture:** For the Assistant's message bubbles, apply a subtle CSS `background-image` of a halftone pattern at 5% opacity to differentiate it from user input without sacrificing legibility.

## Shapes

The shape language is consistently rounded to soften the "technical" feel and make the AI feel more approachable.

- **Standard Elements:** 12px (`rounded-lg`) for buttons, input fields, and small cards.
- **Large Containers:** 16px (`rounded-xl`) for main chat bubbles and anime poster cards.
- **Manga Flair:** Buttons may occasionally feature a "sheared" 5-degree angle on one side or a double-border (1px solid + 3px gap + 1px solid) to reference manga paneling.

## Components

### Sidebar Navigation
- **Active State:** Primary purple background with white text; include a 4px vertical "speed-line" indicator on the left.
- **Inactive State:** Transparent background, Slate-200 text. Hover state uses #1E293B.

### Chat Message Bubbles
- **User:** Filled with Primary (#8B5CF6), text is White. Aligned to the right with 16px corner radius (0px on top-right).
- **Assistant:** Minimalist. Slate (#334155) background with 1px border (#475569). Aligned to the left. Features a small AI icon at the top-left.

### Anime Result Cards
- **Structure:** Vertical layout. Image (top), Title (below image), Tag row (metadata).
- **Score Badge:** A circular or pill-shaped badge in the top-right corner of the image using a Primary-to-Secondary gradient.
- **Interaction:** On hover, the image should scale slightly (1.05x) and the border should glow with the Primary color.

### Fixed Bottom Input
- **Style:** A floating pill-shaped bar or a full-width anchored bar. 
- **Detail:** Use Charcoal (#1E293B) with a subtle halftone pattern fill. Include a "Send" button that uses the Primary color. The text cursor should be the Primary color.

### Tags & Chips
- Small, uppercase Geist-Bold. Background: #334155; Border: 1px solid #475569. Used for genres (e.g., SHONEN, SEINEN).