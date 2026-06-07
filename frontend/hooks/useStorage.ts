"use client";

import { useState, useCallback, useEffect } from "react";
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
} from "@/lib/storage";

export interface UseStorageReturn<T> {
  value: T | null;
  setValue: (value: T | null) => void;
  removeValue: () => void;
  isLoading: boolean;
}

/**
 * Hook for syncing state with localStorage
 * Handles hydration mismatch in SSR environments
 *
 * @example
 * const { value, setValue } = useStorage<User>("user");
 *
 * useEffect(() => {
 *   setValue({ id: 1, name: "John" });
 * }, []);
 */
export function useLocalStorage<T = unknown>(
  key: string,
  initialValue?: T
): UseStorageReturn<T> {
  const [value, setValue] = useState<T | null>(initialValue ?? null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from storage on mount
  useEffect(() => {
    try {
      const stored = getStorageItem<T>(key, "local");
      setValue(stored ?? initialValue ?? null);
    } catch {
      setValue(initialValue ?? null);
    } finally {
      setIsLoading(false);
    }
  }, [key, initialValue]);

  const handleSetValue = useCallback(
    (newValue: T | null) => {
      setValue(newValue);
      if (newValue === null) {
        removeStorageItem(key, "local");
      } else {
        setStorageItem(key, newValue, "local");
      }
    },
    [key]
  );

  const handleRemoveValue = useCallback(() => {
    setValue(null);
    removeStorageItem(key, "local");
  }, [key]);

  return {
    value,
    setValue: handleSetValue,
    removeValue: handleRemoveValue,
    isLoading,
  };
}

/**
 * Hook for syncing state with sessionStorage
 * Similar to useLocalStorage but session-scoped
 */
export function useSessionStorage<T = unknown>(
  key: string,
  initialValue?: T
): UseStorageReturn<T> {
  const [value, setValue] = useState<T | null>(initialValue ?? null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = getStorageItem<T>(key, "session");
      setValue(stored ?? initialValue ?? null);
    } catch {
      setValue(initialValue ?? null);
    } finally {
      setIsLoading(false);
    }
  }, [key, initialValue]);

  const handleSetValue = useCallback(
    (newValue: T | null) => {
      setValue(newValue);
      if (newValue === null) {
        removeStorageItem(key, "session");
      } else {
        setStorageItem(key, newValue, "session");
      }
    },
    [key]
  );

  const handleRemoveValue = useCallback(() => {
    setValue(null);
    removeStorageItem(key, "session");
  }, [key]);

  return {
    value,
    setValue: handleSetValue,
    removeValue: handleRemoveValue,
    isLoading,
  };
}
