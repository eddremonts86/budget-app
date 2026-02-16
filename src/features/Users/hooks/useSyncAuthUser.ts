import { useUser } from '@clerk/tanstack-react-start'
import * as React from 'react'
import { usersApi } from '../api/users.api'

/**
 * Syncs the authenticated Clerk user into the mock users DB.
 * Runs once when the user is loaded and authenticated.
 * Returns the synced user data (id, name, email) for use in todo creation.
 */
export function useSyncAuthUser() {
  const { user, isLoaded } = useUser()
  const [syncedUserId, setSyncedUserId] = React.useState<string | null>(null)
  const [userRole, setUserRole] = React.useState<'admin' | 'user'>('user')
  const hasRun = React.useRef(false)

  React.useEffect(() => {
    if (!isLoaded || !user || hasRun.current) return
    hasRun.current = true

    const syncUser = async () => {
      try {
        const synced = await usersApi.upsertFromAuth({
          id: user.id,
          name: user.fullName || user.username || 'User',
          email: user.primaryEmailAddress?.emailAddress || '',
          avatar: user.imageUrl,
        })
        setSyncedUserId(synced.id)
        setUserRole(synced.role)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to sync auth user:', error)
      }
    }

    syncUser()
  }, [isLoaded, user])

  return {
    syncedUserId,
    userRole,
    userName: user?.fullName || user?.username || 'User',
    userEmail: user?.primaryEmailAddress?.emailAddress || '',
    isReady: isLoaded && !!user && !!syncedUserId,
  }
}
