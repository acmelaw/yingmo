/**
 * Utility functions for shadcn-style components with UnoCSS
 */

import { type ClassValue, clsx } from 'clsx';

/**
 * Merge classes with clsx - works with UnoCSS
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
