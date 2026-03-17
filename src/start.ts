import { clerkMiddleware } from '@clerk/tanstack-react-start/server'
import { createStart } from '@tanstack/react-start'
import type { AnyRequestMiddleware } from '@tanstack/react-start'
import { isClerkServerEnabled } from '@/shared/lib/auth/config'

export const startInstance = createStart(() => {
  const requestMiddleware: readonly AnyRequestMiddleware[] = isClerkServerEnabled()
    ? [clerkMiddleware()]
    : []

  return {
    requestMiddleware,
  }
})
