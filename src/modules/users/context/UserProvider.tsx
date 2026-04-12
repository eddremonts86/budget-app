import * as Sentry from '@sentry/react'
import * as React from 'react'
import { useAppAuth } from '@/shared/lib/auth/app-auth'
import { getClientTestUserId, isClientAuthBypassEnabled } from '@/shared/lib/auth/bypass'
import { syncAuthenticatedUserFn } from '../api/users.fn'
import { canApproveTransactions, getAppRoleKey, getTodoPermissionRole } from '../model/permissions'
import type { User } from '../model/types'
import { UserContext } from './UserContext'

interface SyncState {
  syncedUser: User | null
  isLoading: boolean
}

type SyncAction =
  | { type: 'SET_BYPASS_USER'; user: User }
  | { type: 'RESET' }
  | { type: 'START_SYNC' }
  | { type: 'SYNC_SUCCESS'; user: User }
  | { type: 'SYNC_ERROR' }

function syncReducer(state: SyncState, action: SyncAction): SyncState {
  switch (action.type) {
    case 'SET_BYPASS_USER':
      return { syncedUser: state.syncedUser ?? action.user, isLoading: false }
    case 'RESET':
      return { syncedUser: null, isLoading: false }
    case 'START_SYNC':
      return { ...state, isLoading: true }
    case 'SYNC_SUCCESS':
      return { syncedUser: action.user, isLoading: false }
    case 'SYNC_ERROR':
      return { syncedUser: null, isLoading: false }
  }
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const auth = useAppAuth()
  const [state, dispatch] = React.useReducer(syncReducer, {
    syncedUser: null,
    isLoading: false,
  })
  const lastSyncedIdentity = React.useRef<string | null>(null)
  const isAuthBypassEnabled = isClientAuthBypassEnabled()

  React.useEffect(() => {
    // If we're in E2E mode, we use a mock local user
    if (isAuthBypassEnabled) {
      const testUserId = getClientTestUserId()
      dispatch({
        type: 'SET_BYPASS_USER',
        user: {
          id: testUserId,
          name: 'Local Test User',
          email: 'local-test@example.com',
          avatar: null,
          roleId: 'role_admin',
          roleName: 'admin',
          createdAt: new Date().toISOString(),
        },
      })
      return
    }

    if (!auth.isLoaded) {
      return
    }

    if (!auth.isAuthenticated || !auth.user || !auth.provider) {
      lastSyncedIdentity.current = null
      dispatch({ type: 'RESET' })
      return
    }

    const currentAuthUser = auth.user
    const identityKey = `${auth.provider}:${auth.user.id}`

    if (lastSyncedIdentity.current === identityKey) {
      return
    }

    lastSyncedIdentity.current = identityKey
    dispatch({ type: 'START_SYNC' })

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

        dispatch({ type: 'SYNC_SUCCESS', user: synced })
      } catch (error) {
        lastSyncedIdentity.current = null
        dispatch({ type: 'SYNC_ERROR' })
        Sentry.captureException(error)
      }
    }

    syncUser()
  }, [auth, isAuthBypassEnabled])

  const value = React.useMemo(() => {
    const isReady =
      (isAuthBypassEnabled && !!state.syncedUser) || (auth.isLoaded && !!state.syncedUser)
    const roleKey = getAppRoleKey(state.syncedUser)

    return {
      syncedUserId: state.syncedUser?.id ?? null,
      userRole: getTodoPermissionRole(roleKey),
      roleKey,
      canApproveTransactions: canApproveTransactions(roleKey),
      user: state.syncedUser,
      isLoading: !isReady || state.isLoading,
      isReady,
    }
  }, [auth.isLoaded, state.syncedUser, state.isLoading, isAuthBypassEnabled])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
