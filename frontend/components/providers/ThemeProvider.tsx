"use client";

import { useEffect, useState } from "react";

export interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: "light" | "dark";
  storageKey?: string;
}

/**
 * ThemeProvider Component
 * Manages light/dark mode theme switching with localStorage persistence
 * Applies theme class to document root for CSS variable switching
 */
export function ThemeProvider({
  children,
  defaultTheme = "light",
  storageKey = "trippilot-theme",
}: ThemeProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">(defaultTheme);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    // Always default to light mode to enforce strict light theme
    const initialTheme = "light";

    setTheme(initialTheme);
    applyTheme(initialTheme);
    setMounted(true);
  }, [defaultTheme, storageKey]);

  const applyTheme = (newTheme: "light" | "dark") => {
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const toggleTheme = (newTheme?: "light" | "dark") => {
    const nextTheme = newTheme || (theme === "light" ? "dark" : "light");
    setTheme(nextTheme);
    localStorage.setItem(storageKey, nextTheme);
    applyTheme(nextTheme);
  };

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * Theme Context for consuming components
 */
export interface ThemeContextType {
  theme: "light" | "dark";
  toggleTheme: (newTheme?: "light" | "dark") => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

/**
 * Hook to access theme context
 * Must be used within ThemeProvider
 */
export function useTheme(): ThemeContextType {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}

// Required for server-side rendering
import React from "react";
