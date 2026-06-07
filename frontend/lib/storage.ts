/**
 * Storage utilities for localStorage and sessionStorage
 * Provides type-safe wrappers with JSON serialization
 */

type StorageType = "local" | "session";

function getStorage(type: StorageType): Storage {
  if (typeof window === "undefined") {
    throw new Error(`Storage is not available on the server`);
  }
  return type === "local" ? localStorage : sessionStorage;
}

/**
 * Get a value from storage
 * @param key Storage key
 * @param type 'local' or 'session'
 * @returns Parsed value or null if not found
 */
export function getStorageItem<T = unknown>(
  key: string,
  type: StorageType = "local"
): T | null {
  if (typeof window === "undefined") return null;

  try {
    const storage = getStorage(type);
    const item = storage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

/**
 * Set a value in storage
 * @param key Storage key
 * @param value Value to store (will be JSON serialized)
 * @param type 'local' or 'session'
 */
export function setStorageItem<T = unknown>(
  key: string,
  value: T,
  type: StorageType = "local"
): void {
  if (typeof window === "undefined") return;

  try {
    const storage = getStorage(type);
    storage.setItem(key, JSON.stringify(value));
  } catch {
    // Silently fail (quota exceeded, private mode, etc.)
  }
}

/**
 * Remove a value from storage
 * @param key Storage key
 * @param type 'local' or 'session'
 */
export function removeStorageItem(
  key: string,
  type: StorageType = "local"
): void {
  if (typeof window === "undefined") return;

  try {
    const storage = getStorage(type);
    storage.removeItem(key);
  } catch {
    // Silently fail
  }
}

/**
 * Clear all items from storage
 * @param type 'local' or 'session'
 */
export function clearStorage(type: StorageType = "local"): void {
  if (typeof window === "undefined") return;

  try {
    const storage = getStorage(type);
    storage.clear();
  } catch {
    // Silently fail
  }
}
