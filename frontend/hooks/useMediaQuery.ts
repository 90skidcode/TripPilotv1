"use client";

import { useEffect, useState } from "react";

/**
 * Hook for media query matching
 * Returns true if the media query matches
 *
 * @example
 * const isMobile = useMediaQuery("(max-width: 768px)");
 * const isDark = useMediaQuery("(prefers-color-scheme: dark)");
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if window is defined (client-side)
    if (typeof window === "undefined") return;

    const media = window.matchMedia(query);

    // Set initial value
    setMatches(media.matches);

    // Listen for changes
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", listener);

    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

/**
 * Common viewport breakpoints
 */
export const breakpoints = {
  xs: "(max-width: 320px)",
  sm: "(max-width: 640px)",
  md: "(max-width: 768px)",
  lg: "(max-width: 1024px)",
  xl: "(max-width: 1280px)",
  "2xl": "(max-width: 1536px)",
};

/**
 * Convenience hooks for common breakpoints
 */
export function useIsMobile() {
  return useMediaQuery(breakpoints.sm);
}

export function useIsTablet() {
  return useMediaQuery(breakpoints.md);
}

export function useIsDesktop() {
  return useMediaQuery(`(min-width: 1025px)`);
}
