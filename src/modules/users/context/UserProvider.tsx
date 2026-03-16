import * as React from 'react'
import { useAppAuth } from '@/shared/lib/auth/app-auth'
import { getClientTestUserId, isClientAuthBypassEnabled } from '@/shared/lib/auth/bypass.client'
import { syncAuthenticatedUserFn } from '../api/users.fn'
import { canApproveTransactions, getAppRoleKey, getTodoPermissionRole } from '../model/permissions'
import type { User } from '../model/types'
import { UserContext } from './UserContext'

export function UserProvider({ children }: { children: React.ReactNode }) {
  const auth = useAppAuth()
  const [syncedUser, setSyncedUser] = React.useState<User | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const lastSyncedIdentity = React.useRef<string | null>(null)
  const isAuthBypassEnabled = isClientAuthBypassEnabled()

  React.useEffect(() => {
    // If we're in E2E mode, we use a mock local user
    if (isAuthBypassEnabled) {
      const testUserId = getClientTestUserId()
      if (!syncedUser) {
        setSyncedUser({
          id: testUserId,
          name: 'Local Test User',
          email: 'local-test@example.com',
          avatar: null,
          roleId: 'role_admin',
          roleName: 'admin',
          createdAt: new Date().toISOString(),
        })
      }
      return
    }

    if (!auth.isLoaded) {
      return
    }

    if (!auth.isAuthenticated || !auth.user || !auth.provider) {
      lastSyncedIdentity.current = null
      setSyncedUser(null)
      return
    }

    const currentAuthUser = auth.user
    const identityKey = `${auth.provider}:${auth.user.id}`

    if (lastSyncedIdentity.current === identityKey) {
      return
    }

    lastSyncedIdentity.current = identityKey
    setIsLoading(true)

    const syncUser = async () => {
      try {
        const safeEmail = currentAuthUser.email || `user-${currentAuthUser.id}@example.com`

        const synced = await syncAuthenticatedUserFn({
          data: {
            provider: auth.provider === 'better-auth' ? 'better-auth' : 'clerk',
            providerUserId: currentAuthUser.id,
            name: currentAuthUser.name || 'User',
            email: safeEmail,
            avatar: currentAuthUser.image,
          },
        })

        if (!synced) {
          throw new Error('syncAuthenticatedUserFn returned null or undefined')
        }

        setSyncedUser(synced)
      } catch {
        lastSyncedIdentity.current = null
        // Ignore sync failures; auth state can still render unauthenticated UI.
      } finally {
        setIsLoading(false)
      }
    }

    syncUser()
  }, [auth, isAuthBypassEnabled])

  const value = React.useMemo(() => {
    const isReady = (isAuthBypassEnabled && !!syncedUser) || (auth.isLoaded && !!syncedUser)
    const roleKey = getAppRoleKey(syncedUser)

    return {
      syncedUserId: syncedUser?.id ?? null,
      userRole: getTodoPermissionRole(roleKey),
      roleKey,
      canApproveTransactions: canApproveTransactions(roleKey),
      user: syncedUser,
      isLoading: !isReady || isLoading,
      isReady,
    }
  }, [auth.isLoaded, syncedUser, isLoading, isAuthBypassEnabled])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
