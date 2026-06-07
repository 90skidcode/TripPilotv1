/**
 * Spacing Scale
 * Used for padding, margins, gaps across components
 * Based on 4px base unit
 */

export const spacing = {
  // Base 4px scale
  0: "0px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",
  32: "128px",
} as const;

/**
 * Semantic spacing for common patterns
 */
export const semanticSpacing = {
  // Component padding
  "component-xs": "4px",
  "component-sm": "8px",
  "component-md": "12px",
  "component-lg": "16px",
  "component-xl": "20px",

  // Section padding
  "section-sm": "16px",
  "section-md": "24px",
  "section-lg": "32px",
  "section-xl": "48px",

  // Gaps between elements
  "gap-xs": "4px",
  "gap-sm": "8px",
  "gap-md": "12px",
  "gap-lg": "16px",
  "gap-xl": "24px",

  // Gaps in grids
  "grid-gap-sm": "12px",
  "grid-gap-md": "16px",
  "grid-gap-lg": "24px",

  // Border radius
  "radius-sm": "4px",
  "radius-md": "8px",
  "radius-lg": "12px",
  "radius-xl": "16px",
  "radius-full": "9999px",
} as const;

/**
 * Common component size scales
 */
export const componentSizes = {
  // Button heights
  button: {
    xs: "24px",
    sm: "32px",
    md: "40px",
    lg: "48px",
    xl: "56px",
  },

  // Input heights
  input: {
    sm: "32px",
    md: "40px",
    lg: "48px",
  },

  // Icon sizes
  icon: {
    xs: "12px",
    sm: "16px",
    md: "20px",
    lg: "24px",
    xl: "32px",
    "2xl": "40px",
  },

  // Avatar sizes
  avatar: {
    xs: "24px",
    sm: "32px",
    md: "40px",
    lg: "48px",
    xl: "56px",
  },
} as const;
