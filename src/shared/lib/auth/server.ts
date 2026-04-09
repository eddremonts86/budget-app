import { getRequestHeaders } from '@tanstack/react-start/server'
import { auth as betterAuth } from './better-auth'
import { getServerTestUserId, isServerAuthBypassEnabled } from './bypass.server'
import { getAuthMode, isBetterAuthEnabled, isClerkServerEnabled, type AuthMode } from './config'

export type ServerAuthProvider = 'bypass' | 'better-auth' | 'clerk' | null

export interface ServerAuthUser {
  authMode: AuthMode
  provider: ServerAuthProvider
  userId: string | null
  email: string | null
  name: string | null
  image: string | null
  role: string | null
}

export const getAuthUser = async (): Promise<ServerAuthUser> => {
  const authMode = getAuthMode()

  if (isServerAuthBypassEnabled()) {
    const userId = getServerTestUserId()

    return {
      authMode,
      provider: 'bypass',
      userId,
      email: 'local-test@example.com',
      name: 'Local Test User',
      image: null,
      role: 'admin',
    }
  }

  if (isBetterAuthEnabled()) {
    const headers = getRequestHeaders()
    const session = await betterAuth.api.getSession({ headers })

    if (session?.user?.id) {
      return {
        authMode,
        provider: 'better-auth',
        userId: session.user.id,
        email: session.user.email ?? null,
        name: session.user.name ?? null,
        image: session.user.image ?? null,
        role: 'user',
      }
    }
  }

  if (isClerkServerEnabled()) {
    const { auth: clerkAuth } = await import('@clerk/tanstack-react-start/server')
    const user = await clerkAuth()
    const publicMetadata =
      user.sessionClaims?.publicMetadata && typeof user.sessionClaims.publicMetadata === 'object'
        ? (user.sessionClaims.publicMetadata as Record<string, unknown>)
        : null
    const role = typeof publicMetadata?.role === 'string' ? publicMetadata.role : null

    if (user.userId) {
      return {
        authMode,
        provider: 'clerk',
        userId: user.userId,
        email: null,
        name: null,
        image: null,
        role,
      }
    }
  }

  return {
    authMode,
    provider: null,
    userId: null,
    email: null,
    name: null,
    image: null,
    role: null,
  }
}

export const requireAuth = async () => {
  const { userId } = await getAuthUser()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  return userId
}

export const requireAuthUser = async () => {
  const user = await getAuthUser()

  if (!user.userId) {
    throw new Error('Unauthorized')
  }

  return user as ServerAuthUser & { userId: string }
}
