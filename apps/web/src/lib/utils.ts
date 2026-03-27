/**
 * Utility Functions
 * Class name merging and utility functions
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper precedence handling
 * Combines clsx for conditional classes and twMerge for Tailwind specificity
 *
 * @param inputs - Class values (strings, objects, arrays, etc.)
 * @returns Merged class string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
