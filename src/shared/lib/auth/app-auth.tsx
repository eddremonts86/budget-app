import {
  useAuth as useClerkAuth,
  useClerk,
  useUser as useClerkUser,
} from '@clerk/tanstack-react-start'
import * as React from 'react'
import { authClient, useSession as useBetterAuthSession } from './better-auth-client'
import { getClientTestUserId, isClientAuthBypassEnabled } from './bypass'
import { getAuthMode, getClerkPublishableKey, isBetterAuthEnabled, isClerkEnabled } from './config'

export type AppAuthProviderKind = 'bypass' | 'clerk' | 'better-auth' | null

export interface AppAuthUser {
  id: string
  email: string
  name: string
  image: string | null
  role: string | null
}

interface AppAuthContextValue {
  authMode: 'local' | 'clerk' | 'hybrid'
  provider: AppAuthProviderKind
  isLoaded: boolean
  isAuthenticated: boolean
  userId: string | null
  user: AppAuthUser | null
  canSignOut: boolean
  signOut: () => Promise<void>
}

interface BetterAuthSessionShape {
  user?: {
    id?: string
    email?: string | null
    name?: string | null
    image?: string | null
  } | null
}

interface BetterAuthHookResult {
  data?: BetterAuthSessionShape | null
  isPending?: boolean
}

interface ClerkAuthSnapshot {
  isLoaded: boolean
  userId: string | null
  user: {
    id: string
    email: string
    name: string
    image: string | null
    role: string | null
  } | null
  signOut: () => Promise<void>
}

const AppAuthContext = React.createContext<AppAuthContextValue | undefined>(undefined)

const defaultAsyncNoop = async () => {}

function redirectToHomeAfterSignOut() {
  if (typeof window === 'undefined') {
    return
  }

  window.location.replace('/')
}

function getBetterAuthUser(session: BetterAuthSessionShape | null | undefined): AppAuthUser | null {
  const user = session?.user

  if (!user?.id) {
    return null
  }

  return {
    id: user.id,
    email: user.email ?? '',
    name: user.name ?? 'User',
    image: user.image ?? null,
    role: 'user',
  }
}

function getBypassUser(): AppAuthUser {
  const testUserId = getClientTestUserId()

  return {
    id: testUserId,
    email: 'local-test@example.com',
    name: 'Local Test User',
    image: null,
    role: 'admin',
  }
}

function buildAppAuthValue({
  isHydrated,
  betterAuth,
  clerk,
}: {
  isHydrated: boolean
  betterAuth: BetterAuthHookResult
  clerk: ClerkAuthSnapshot | null
}): AppAuthContextValue {
  const authMode = getAuthMode()
  const isBypassEnabled = isClientAuthBypassEnabled()

  if (!isHydrated && !isBypassEnabled) {
    return {
      authMode,
      provider: null,
      isLoaded: false,
      isAuthenticated: false,
      userId: null,
      user: null,
      canSignOut: false,
      signOut: defaultAsyncNoop,
    }
  }

  if (isBypassEnabled) {
    const user = getBypassUser()

    return {
      authMode,
      provider: 'bypass',
      isLoaded: true,
      isAuthenticated: true,
      userId: user.id,
      user,
      canSignOut: false,
      signOut: defaultAsyncNoop,
    }
  }

  const betterAuthUser = isBetterAuthEnabled() ? getBetterAuthUser(betterAuth.data ?? null) : null

  if (betterAuthUser) {
    return {
      authMode,
      provider: 'better-auth',
      isLoaded: true,
      isAuthenticated: true,
      userId: betterAuthUser.id,
      user: betterAuthUser,
      canSignOut: true,
      signOut: async () => {
        await authClient.signOut()
        redirectToHomeAfterSignOut()
      },
    }
  }

  if (clerk?.userId && clerk.user) {
    return {
      authMode,
      provider: 'clerk',
      isLoaded: true,
      isAuthenticated: true,
      userId: clerk.userId,
      user: clerk.user,
      canSignOut: true,
      signOut: async () => {
        await clerk.signOut()
        redirectToHomeAfterSignOut()
      },
    }
  }

  const betterLoaded = !isBetterAuthEnabled() || !betterAuth.isPending
  const clerkLoaded = clerk ? clerk.isLoaded : true

  return {
    authMode,
    provider: null,
    isLoaded: betterLoaded && clerkLoaded,
    isAuthenticated: false,
    userId: null,
    user: null,
    canSignOut: false,
    signOut: defaultAsyncNoop,
  }
}

const emptySubscribe = () => () => {}

function AppAuthContextProvider({
  children,
  betterAuth,
  clerk,
}: {
  children: React.ReactNode
  betterAuth: BetterAuthHookResult
  clerk: ClerkAuthSnapshot | null
}) {
  const isHydrated = React.useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  )

  const value = React.useMemo(
    () => buildAppAuthValue({ isHydrated, betterAuth, clerk }),
    [betterAuth, clerk, isHydrated],
  )

  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>
}

function ClerkAwareAppAuthProvider({
  children,
  betterAuth,
}: {
  children: React.ReactNode
  betterAuth: BetterAuthHookResult
}) {
  const clerkAuth = useClerkAuth()
  const clerkUser = useClerkUser()
  const clerk = useClerk()

  const clerkSnapshot = React.useMemo<ClerkAuthSnapshot>(
    () => ({
      isLoaded: clerkAuth.isLoaded && clerkUser.isLoaded,
      userId: clerkAuth.userId ?? null,
      user: clerkUser.user
        ? {
            id: clerkUser.user.id,
            email: clerkUser.user.primaryEmailAddress?.emailAddress ?? '',
            name: clerkUser.user.fullName ?? clerkUser.user.username ?? 'User',
            image: clerkUser.user.imageUrl ?? null,
            role:
              typeof clerkUser.user.publicMetadata?.role === 'string'
                ? clerkUser.user.publicMetadata.role
                : 'user',
          }
        : null,
      signOut: async () => {
        await clerk.signOut()
        redirectToHomeAfterSignOut()
      },
    }),
    [clerk, clerkAuth.isLoaded, clerkAuth.userId, clerkUser.isLoaded, clerkUser.user],
  )

  return (
    <AppAuthContextProvider betterAuth={betterAuth} clerk={clerkSnapshot}>
      {children}
    </AppAuthContextProvider>
  )
}

export function AppAuthProvider({ children }: { children: React.ReactNode }) {
  const betterAuth = useBetterAuthSession()
  const isClerkRuntimeEnabled = isClerkEnabled() && !!getClerkPublishableKey()

  if (isClerkRuntimeEnabled) {
    return <ClerkAwareAppAuthProvider betterAuth={betterAuth}>{children}</ClerkAwareAppAuthProvider>
  }

  return (
    <AppAuthContextProvider betterAuth={betterAuth} clerk={null}>
      {children}
    </AppAuthContextProvider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppAuth() {
  const context = React.useContext(AppAuthContext)

  if (!context) {
    throw new Error('useAppAuth must be used within an AppAuthProvider')
  }

  return context
}
