"use client";

import { useState, useCallback } from "react";

export interface UseSidebarReturn {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

/**
 * Hook for managing sidebar open/closed state
 * Stores state in localStorage for persistence
 *
 * @example
 * const { isOpen, toggle, open, close } = useSidebar();
 *
 * return (
 *   <>
 *     <button onClick={toggle}>Toggle Sidebar</button>
 *     {isOpen && <Sidebar />}
 *   </>
 * );
 */
export function useSidebar(
  storageKey: string = "sidebar-open"
): UseSidebarReturn {
  // Initialize from localStorage if available
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : true;
    } catch {
      return true;
    }
  });

  const toggle = useCallback(() => {
    setIsOpen((prev: boolean) => {
      const newState = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, JSON.stringify(newState));
      }
      return newState;
    });
  }, [storageKey]);

  const open = useCallback(() => {
    setIsOpen(true);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(true));
    }
  }, [storageKey]);

  const close = useCallback(() => {
    setIsOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, JSON.stringify(false));
    }
  }, [storageKey]);

  return { isOpen, toggle, open, close };
}
