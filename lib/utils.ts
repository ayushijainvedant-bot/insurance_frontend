import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines class names and resolves Tailwind conflicts.
 *
 * Why this exists: if you write
 *   cn("px-2 py-1", isActive && "px-4")
 * a plain template string would leave you with BOTH "px-2" and "px-4"
 * in the output, and the browser would just use whichever CSS rule
 * happens to be declared last. twMerge understands Tailwind's classes
 * well enough to know "px-4" should replace "px-2", not sit next to it.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
