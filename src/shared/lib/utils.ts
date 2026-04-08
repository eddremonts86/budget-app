import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Extracts a human-readable error string from TanStack Form v1 field errors.
 * In v1 with Zod (Standard Schema), errors are raw issue objects {message, path, code, ...}.
 */
export function getFieldError(error: unknown): string {
  if (typeof error === 'string') return error
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: string }).message)
  }
  return String(error)
}
