import { useUser } from '@clerk/tanstack-react-start'
import * as React from 'react'
import { upsertUserFn } from '../api/users.fn'
import type { User } from '../model/types'
import { UserContext } from './UserContext'

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded: clerkIsLoaded } = useUser()
  const [syncedUser, setSyncedUser] = React.useState<User | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const hasRun = React.useRef(false)
  const isE2E = import.meta.env.VITE_E2E === 'true'

  React.useEffect(() => {
    // If we're in E2E mode, we use a mock local user
    if (isE2E) {
      if (!syncedUser) {
        setSyncedUser({
          id: 'user_e2e_local',
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

    if (!clerkIsLoaded) {
      return
    }

    if (!clerkUser) {
      return
    }

    // If we already synced this user session, don't run again unless clerkUser changes significantly
    if (hasRun.current && syncedUser?.id === clerkUser.id) {
      return
    }

    hasRun.current = true
    setIsLoading(true)

    const syncUser = async () => {
      try {
        const email = clerkUser.primaryEmailAddress?.emailAddress || ''
        const name = clerkUser.fullName || clerkUser.username || 'User'
        const avatar = clerkUser.imageUrl || null

        // Ensure we have a valid email or placeholder
        const safeEmail = email || `user-${clerkUser.id}@example.com`

        const userData = {
          id: clerkUser.id,
          name,
          email: safeEmail,
          avatar,
          role: 'user' as const,
        }

        const synced = await upsertUserFn({
          data: {
            ...userData,
            roleId: 'role_user', // Provide a default roleId for new synced users
          },
        })

        if (!synced) {
          throw new Error('upsertUserFn returned null or undefined')
        }

        setSyncedUser(synced)
      } catch (error) {
        console.error('UserProvider: Failed to sync auth user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    syncUser()
  }, [clerkIsLoaded, clerkUser, syncedUser?.id, isE2E])

  const value = React.useMemo(() => {
    const isReady = (isE2E && !!syncedUser) || (clerkIsLoaded && !!syncedUser)
    return {
      syncedUserId: syncedUser?.id ?? null,
      userRole: (syncedUser?.roleName === 'admin' ? 'admin' : 'user') as 'admin' | 'user',
      user: syncedUser,
      isLoading: !isReady || isLoading,
      isReady,
    }
  }, [syncedUser, clerkIsLoaded, isLoading, isE2E])

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
