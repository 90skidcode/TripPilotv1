import type { Config } from "tailwindcss";

const config = {
  darkMode: "class",
  safelist: [
    "bg-primary", "text-primary", "border-primary",
    "bg-secondary", "text-secondary", "border-secondary",
    "bg-destructive", "text-destructive", "border-destructive",
    "bg-muted", "text-muted", "border-muted",
    "bg-accent", "text-accent", "border-accent",
    "bg-card", "text-card", "border-card",
    "bg-foreground", "text-foreground", "border-foreground",
    "bg-background", "text-background", "border-background",
    "bg-popover", "text-popover", "border-popover",
    "bg-input", "text-input", "border-input",
    "bg-ring", "text-ring", "border-ring",
    "text-primary-foreground",
    "text-secondary-foreground",
    "text-destructive-foreground",
    "text-muted-foreground",
    "text-accent-foreground",
    "text-card-foreground",
    "text-popover-foreground",
  ],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "rgb(var(--color-border))",
        input: "rgb(var(--color-input))",
        ring: "rgb(var(--color-ring))",
        background: "rgb(var(--color-background))",
        foreground: "rgb(var(--color-foreground))",
        primary: {
          DEFAULT: "rgb(var(--color-primary))",
          foreground: "rgb(var(--color-primary-foreground))",
        },
        secondary: {
          DEFAULT: "rgb(var(--color-secondary))",
          foreground: "rgb(var(--color-secondary-foreground))",
        },
        destructive: {
          DEFAULT: "rgb(var(--color-destructive))",
          foreground: "rgb(var(--color-destructive-foreground))",
        },
        muted: {
          DEFAULT: "rgb(var(--color-muted))",
          foreground: "rgb(var(--color-muted-foreground))",
        },
        accent: {
          DEFAULT: "rgb(var(--color-accent))",
          foreground: "rgb(var(--color-accent-foreground))",
        },
        popover: {
          DEFAULT: "rgb(var(--color-popover))",
          foreground: "rgb(var(--color-popover-foreground))",
        },
        card: {
          DEFAULT: "rgb(var(--color-card))",
          foreground: "rgb(var(--color-card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["Fira Code", "Courier New", "monospace"],
      },
      animation: {
        spin: "spin 1s linear infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
