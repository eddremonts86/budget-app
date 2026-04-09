import { clerkMiddleware } from '@clerk/tanstack-react-start/server'
import { createStart } from '@tanstack/react-start'
import type { AnyRequestMiddleware } from '@tanstack/react-start'
import { isClerkServerEnabled } from '@/shared/lib/auth/config'
import { isServerAuthBypassEnabled } from '@/shared/lib/auth/bypass.server'

export const startInstance = createStart(() => {
  const requestMiddleware: readonly AnyRequestMiddleware[] =
    isClerkServerEnabled() && !isServerAuthBypassEnabled() ? [clerkMiddleware()] : []

  return {
    requestMiddleware,
  }
})
