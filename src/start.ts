import { clerkMiddleware } from '@clerk/tanstack-react-start/server'
import { createStart } from '@tanstack/react-start'
import type { AnyRequestMiddleware } from '@tanstack/react-start'
import { isClerkServerEnabled } from '@/shared/lib/auth/config'

function isAuthBypassEnabled(): boolean {
  if (typeof process === 'undefined') return false
  const env = process.env
  const isTruthy = (v?: string) => v === 'true' || v === '1'
  const skipAuth = isTruthy(env.SKIP_AUTH) || isTruthy(env.VITE_SKIP_AUTH) || isTruthy(env.VITE_E2E)
  return env.NODE_ENV !== 'production' && skipAuth
}

export const startInstance = createStart(() => {
  const requestMiddleware: readonly AnyRequestMiddleware[] =
    isClerkServerEnabled() && !isAuthBypassEnabled() ? [clerkMiddleware()] : []

  return {
    requestMiddleware,
  }
})
