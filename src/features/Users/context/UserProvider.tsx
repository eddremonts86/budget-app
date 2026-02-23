import { useUser } from '@clerk/tanstack-react-start'
import * as React from 'react'
import { upsertUserFn } from '../api/users.fn'
import type { User } from '../model/types'
import { UserContext } from './UserContext'

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser()
  const [syncedUser, setSyncedUser] = React.useState<User | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const hasRun = React.useRef(false)

  React.useEffect(() => {
    if (!isLoaded || !clerkUser) return

    // If we already synced this user session, don't run again unless clerkUser changes significantly
    if (hasRun.current && syncedUser?.id === clerkUser.id) return

    hasRun.current = true
    setIsLoading(true)

    const syncUser = async () => {
      try {
        const email = clerkUser.primaryEmailAddress?.emailAddress || ''
        const name = clerkUser.fullName || clerkUser.username || 'User'
        const avatar = clerkUser.imageUrl || null
        
        // Ensure we have a valid email or placeholder
        const safeEmail = email || `user-${clerkUser.id}@example.com`

        console.log('Syncing user with Clerk data:', {
          id: clerkUser.id,
          name,
          email: safeEmail,
          originalEmail: email,
          avatar,
        })

        const userData = {
          id: clerkUser.id,
          name,
          email: safeEmail,
          avatar,
          role: 'user' as const,
        }

        const synced = await upsertUserFn({
          data: userData,
        })
        
        if (!synced) {
           throw new Error('upsertUserFn returned null or undefined')
        }

        setSyncedUser(synced)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(
          `Failed to sync auth user: ${
            error instanceof Error ? error.message : String(error)
          }`,
          error
        )
      } finally {
        setIsLoading(false)
      }
    }

    syncUser()
  }, [isLoaded, clerkUser, syncedUser?.id])

  const value = React.useMemo(
    () => ({
      syncedUserId: syncedUser?.id ?? null,
      userRole: syncedUser?.role ?? 'user',
      user: syncedUser,
      isReady: isLoaded && !!syncedUser,
      isLoading,
    }),
    [syncedUser, isLoaded, isLoading],
  )

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>
}
