---
name: Heritage Excellence
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#43474f'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#737780'
  outline-variant: '#c3c6d1'
  surface-tint: '#3a5f94'
  primary: '#001e40'
  on-primary: '#ffffff'
  primary-container: '#003366'
  on-primary-container: '#799dd6'
  inverse-primary: '#a7c8ff'
  secondary: '#bb0027'
  on-secondary: '#ffffff'
  secondary-container: '#e0283c'
  on-secondary-container: '#fffbff'
  tertiary: '#735c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#cca830'
  on-tertiary-container: '#4f3e00'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d5e3ff'
  primary-fixed-dim: '#a7c8ff'
  on-primary-fixed: '#001b3c'
  on-primary-fixed-variant: '#1f477b'
  secondary-fixed: '#ffdad8'
  secondary-fixed-dim: '#ffb3b1'
  on-secondary-fixed: '#410007'
  on-secondary-fixed-variant: '#92001c'
  tertiary-fixed: '#ffe088'
  tertiary-fixed-dim: '#e9c349'
  on-tertiary-fixed: '#241a00'
  on-tertiary-fixed-variant: '#574500'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Hanken Grotesk
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
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
---

## Brand & Style

This design system draws inspiration from a legacy of industry leadership and established trust. The brand personality is authoritative yet welcoming, balancing a storied heritage with modern professional standards. It aims to evoke an emotional response of reliability, premium quality, and enduring stability.

The design style is **Corporate Modern with a Premium focus**. It utilizes a structured, high-contrast approach that favors clean lines and deliberate accents. We avoid unnecessary ornamentation in favor of precise execution, using the interplay of deep navy and gold to communicate a sense of "prestige" and "established value." The interface should feel substantial and grounded, never ephemeral.

## Colors

The palette is anchored by **Gudang Garam Blue**, used for core navigation, primary headings, and structural elements to establish a bedrock of trust. **Gudang Garam Gold** is the "Premium" accent, reserved for high-value conversion points, achievement states, and subtle decorative flourishes that signal quality.

**Gudang Garam Red** serves as the secondary action color and critical status indicator. It should be used sparingly to maintain its impact. The background surfaces remain crisp white or extremely light gray to ensure the primary blue and gold accents retain their vibrancy and professional contrast.

## Typography

**Hanken Grotesk** is used across all levels to provide a sharp, contemporary, and highly legible experience. The hierarchy is strictly enforced through weight variations. 

- **Headlines:** Set in Bold (700) or SemiBold (600) using the Primary Blue to project authority.
- **Body Text:** Uses a Medium weight for standard reading to ensure the text feels "substantial" rather than thin.
- **Labels:** Small labels use an increased letter spacing and uppercase styling to mimic the feel of traditional premium engravings and professional documentation.

## Layout & Spacing

This design system utilizes a **Fixed Grid** model for desktop to maintain a sense of controlled, architectural order. On desktop, the layout is centered with a max-width of 1280px.

- **Desktop:** 12-column grid with 24px gutters.
- **Tablet:** 8-column grid with 20px gutters and 24px side margins.
- **Mobile:** 4-column fluid grid with 16px gutters and 16px side margins.

The spacing rhythm is based on an 8px base unit. Generous white space (using `xxl` and `xl` increments) should be used between major sections to emphasize the premium, "un-cluttered" nature of the brand.

## Elevation & Depth

To maintain a "Premium" and "Established" feel, the design system avoids heavy shadows in favor of **Tonal Layers** and **Low-Contrast Outlines**.

- **Surface Levels:** The primary background is White (#FFFFFF). Secondary containers or "cards" use a very subtle light gray tint or a thin 1px border (#E5E7EB).
- **Shadows:** When depth is required (e.g., for modals or floating action buttons), use "Ambient Shadows"—extremely soft, diffused, and low-opacity (4-8%) with a slight blue tint to harmonize with the primary brand color.
- **Dividers:** Use thin, 1px horizontal lines in light gray to separate content, maintaining a clean, structured appearance.

## Shapes

The shape language is **Soft**. We use a 0.25rem (4px) base radius for standard elements like buttons and input fields. This slight rounding takes the "edge" off the corporate feel without appearing overly casual or playful.

- **Primary Elements:** 4px radius (Soft).
- **Cards & Large Containers:** 8px radius (Large).
- **Icons:** Should follow a consistent 2px stroke weight with slightly rounded terminals to match the typography.

## Components

### Buttons
- **Primary (Premium):** Solid Gold (#D4AF37) with White or Navy text. Reserved for the most important "Call to Action."
- **Secondary (Brand):** Solid Navy (#003366) with White text. Used for standard navigation and primary page actions.
- **Tertiary:** Outlined Navy or Ghost buttons for low-priority actions.
- **Alert:** Solid Red (#C8102E) reserved strictly for destructive actions (e.g., Delete).

### Input Fields
Inputs feature a 1px border in light gray that transitions to a 2px Navy border on focus. Labels are always positioned above the field in `label-sm` uppercase styling for a "form-like" professional appearance.

### Cards
Cards should be used to group related information. They use a white surface with a subtle 1px border rather than a shadow. If a card is "featured," a thin Gold top-border can be added to denote premium content.

### Chips & Tags
Used for categorization. These should have a subtle background tint of the Primary Blue (at 10% opacity) with Navy text, using the "Soft" 4px corner radius.

### Data Tables
In line with an "Established" brand, tables should be clean with clear header backgrounds in very light gray and subtle dividers. Row hover states should use a light blue tint.