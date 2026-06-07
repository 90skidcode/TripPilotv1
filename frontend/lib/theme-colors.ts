/**
 * Design System Color Tokens
 * HSL values for dynamic theming support (light/dark mode)
 */

export const colors = {
  // Primary color - Main brand color
  primary: {
    50: "210 100% 97%",
    100: "210 100% 94%",
    200: "210 98% 88%",
    300: "210 96% 82%",
    400: "210 93% 69%",
    500: "210 90% 56%", // Primary base
    600: "210 88% 48%",
    700: "210 86% 39%",
    800: "210 84% 32%",
    900: "210 82% 26%",
  },

  // Secondary color - Accent/complementary
  secondary: {
    50: "259 100% 97%",
    100: "259 100% 94%",
    200: "259 98% 88%",
    300: "259 96% 82%",
    400: "259 93% 69%",
    500: "259 90% 56%", // Secondary base
    600: "259 88% 48%",
    700: "259 86% 39%",
    800: "259 84% 32%",
    900: "259 82% 26%",
  },

  // Neutral - Grayscale for text, borders, backgrounds
  neutral: {
    50: "0 0% 98%",
    100: "0 0% 96%",
    200: "0 0% 92%",
    300: "0 0% 87%",
    400: "0 0% 73%",
    500: "0 0% 57%",
    600: "0 0% 48%",
    700: "0 0% 38%",
    800: "0 0% 23%",
    900: "0 0% 13%",
  },

  // Success - Positive actions/states
  success: {
    50: "142 76% 96%",
    100: "142 71% 92%",
    200: "142 65% 85%",
    300: "142 61% 74%",
    400: "142 68% 56%",
    500: "142 70% 45%", // Success base
    600: "142 72% 38%",
    700: "142 73% 30%",
    800: "142 74% 22%",
    900: "142 75% 15%",
  },

  // Warning - Caution/attention
  warning: {
    50: "48 100% 96%",
    100: "48 100% 92%",
    200: "48 98% 85%",
    300: "48 97% 74%",
    400: "48 95% 56%",
    500: "48 96% 46%", // Warning base
    600: "48 96% 38%",
    700: "48 96% 30%",
    800: "48 97% 22%",
    900: "48 98% 15%",
  },

  // Error/Destructive - Danger/delete actions
  error: {
    50: "0 100% 97%",
    100: "0 100% 94%",
    200: "0 98% 88%",
    300: "0 96% 82%",
    400: "0 93% 69%",
    500: "0 84% 60%", // Error base
    600: "0 91% 50%",
    700: "0 86% 40%",
    800: "0 82% 31%",
    900: "0 80% 24%",
  },

  // Info - Informational messages
  info: {
    50: "207 100% 97%",
    100: "207 100% 94%",
    200: "207 98% 88%",
    300: "207 96% 82%",
    400: "207 93% 69%",
    500: "207 89% 56%", // Info base
    600: "207 88% 48%",
    700: "207 86% 39%",
    800: "207 84% 32%",
    900: "207 82% 26%",
  },
} as const;

/**
 * Semantic color aliases for common UI needs
 * Maps to actual color values based on light/dark mode in CSS variables
 */
export const semanticColors = {
  background: "0 0% 100%",
  foreground: "0 0% 13%",
  muted: "0 0% 96%",
  "muted-foreground": "0 0% 48%",
  border: "0 0% 92%",
  input: "0 0% 96%",
  ring: "210 90% 56%",
  card: "0 0% 100%",
  "card-foreground": "0 0% 13%",
} as const;

/**
 * CSS variable names for theming
 */
export const cssVars = {
  // Light mode (default)
  light: {
    "--background": "0 0% 100%",
    "--foreground": "0 0% 13%",
    "--card": "0 0% 100%",
    "--card-foreground": "0 0% 13%",
    "--popover": "0 0% 100%",
    "--popover-foreground": "0 0% 13%",
    "--muted": "0 0% 96%",
    "--muted-foreground": "0 0% 48%",
    "--accent": "259 90% 56%",
    "--accent-foreground": "0 0% 100%",
    "--destructive": "0 84% 60%",
    "--destructive-foreground": "0 0% 100%",
    "--border": "0 0% 92%",
    "--input": "0 0% 96%",
    "--ring": "210 90% 56%",
    "--primary": "210 90% 56%",
    "--primary-foreground": "0 0% 100%",
    "--secondary": "259 90% 56%",
    "--secondary-foreground": "0 0% 100%",
  },

  // Dark mode
  dark: {
    "--background": "0 0% 13%",
    "--foreground": "0 0% 98%",
    "--card": "0 0% 20%",
    "--card-foreground": "0 0% 98%",
    "--popover": "0 0% 20%",
    "--popover-foreground": "0 0% 98%",
    "--muted": "0 0% 30%",
    "--muted-foreground": "0 0% 73%",
    "--accent": "259 90% 56%",
    "--accent-foreground": "0 0% 13%",
    "--destructive": "0 84% 60%",
    "--destructive-foreground": "0 0% 13%",
    "--border": "0 0% 30%",
    "--input": "0 0% 23%",
    "--ring": "210 90% 56%",
    "--primary": "210 90% 56%",
    "--primary-foreground": "0 0% 13%",
    "--secondary": "259 90% 56%",
    "--secondary-foreground": "0 0% 13%",
  },
} as const;
