import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge classnames with proper Tailwind CSS conflict resolution
 * Combines clsx for conditional classes with twMerge for Tailwind conflicts
 *
 * @example
 * cn("px-4 py-2", "px-6")  // Result: "py-2 px-6" (px-6 overrides px-4)
 * cn("px-4", isActive && "bg-blue-500")  // Conditional classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
