/**
 * Typography Scale
 * Font sizes, weights, and line heights for consistent text styling
 */

export const typography = {
  // Display styles - Large headings for page/section headers
  display: {
    xl: {
      fontSize: "48px",
      lineHeight: "56px",
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    lg: {
      fontSize: "40px",
      lineHeight: "48px",
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
    md: {
      fontSize: "32px",
      lineHeight: "40px",
      fontWeight: 700,
      letterSpacing: "-0.01em",
    },
  },

  // Heading styles - Section and component headings
  heading: {
    xl: {
      fontSize: "28px",
      lineHeight: "36px",
      fontWeight: 700,
    },
    lg: {
      fontSize: "24px",
      lineHeight: "32px",
      fontWeight: 700,
    },
    md: {
      fontSize: "20px",
      lineHeight: "28px",
      fontWeight: 700,
    },
    sm: {
      fontSize: "18px",
      lineHeight: "26px",
      fontWeight: 600,
    },
    xs: {
      fontSize: "16px",
      lineHeight: "24px",
      fontWeight: 600,
    },
  },

  // Body styles - Regular text content
  body: {
    lg: {
      fontSize: "18px",
      lineHeight: "28px",
      fontWeight: 400,
    },
    md: {
      fontSize: "16px",
      lineHeight: "24px",
      fontWeight: 400,
    },
    sm: {
      fontSize: "14px",
      lineHeight: "20px",
      fontWeight: 400,
    },
    xs: {
      fontSize: "12px",
      lineHeight: "16px",
      fontWeight: 400,
    },
  },

  // Body bold - Emphasized body text
  "body-bold": {
    lg: {
      fontSize: "18px",
      lineHeight: "28px",
      fontWeight: 600,
    },
    md: {
      fontSize: "16px",
      lineHeight: "24px",
      fontWeight: 600,
    },
    sm: {
      fontSize: "14px",
      lineHeight: "20px",
      fontWeight: 600,
    },
    xs: {
      fontSize: "12px",
      lineHeight: "16px",
      fontWeight: 600,
    },
  },

  // Label styles - Form labels and small UI text
  label: {
    lg: {
      fontSize: "14px",
      lineHeight: "20px",
      fontWeight: 600,
    },
    md: {
      fontSize: "13px",
      lineHeight: "18px",
      fontWeight: 600,
    },
    sm: {
      fontSize: "12px",
      lineHeight: "16px",
      fontWeight: 600,
    },
    xs: {
      fontSize: "11px",
      lineHeight: "14px",
      fontWeight: 600,
    },
  },

  // Caption styles - Very small text (help text, meta info)
  caption: {
    md: {
      fontSize: "13px",
      lineHeight: "18px",
      fontWeight: 400,
    },
    sm: {
      fontSize: "12px",
      lineHeight: "16px",
      fontWeight: 400,
    },
    xs: {
      fontSize: "11px",
      lineHeight: "14px",
      fontWeight: 400,
    },
  },

  // Code styles - Monospace for code/technical text
  code: {
    md: {
      fontSize: "14px",
      lineHeight: "20px",
      fontWeight: 400,
      fontFamily: "monospace",
    },
    sm: {
      fontSize: "12px",
      lineHeight: "16px",
      fontWeight: 400,
      fontFamily: "monospace",
    },
  },
} as const;

/**
 * Font family definitions
 */
export const fonts = {
  sans: [
    "-apple-system",
    "BlinkMacSystemFont",
    '"Segoe UI"',
    "Roboto",
    '"Helvetica Neue"',
    "Arial",
    "sans-serif",
    '"Apple Color Emoji"',
    '"Segoe UI Emoji"',
  ].join(", "),
  mono: [
    '"Fira Code"',
    '"Courier New"',
    "monospace",
  ].join(", "),
} as const;
