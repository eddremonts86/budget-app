import { useUser } from '@clerk/tanstack-react-start'
import * as React from 'react'
import { upsertUserFn } from '../api/users.fn'
import type { User } from '../model/types'

interface UserContextValue {
  syncedUserId: string | null
  userRole: 'admin' | 'user'
  user: User | null
  isReady: boolean
  isLoading: boolean
}

export const UserContext = React.createContext<UserContextValue | undefined>(undefined)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded } = useUser()
  const [syncedUser, setSyncedUser] = React.useState<User | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const hasRun = React.useRef(false)

  React.useEffect(() => {
    if (!isLoaded || !clerkUser) return

    // If we already synced this user session, don't run again unless clerkUser changes significantly (which triggers re-render anyway)
    // Use a ref to prevent double-firing in StrictMode or rapid re-renders
    if (hasRun.current && syncedUser?.id === clerkUser.id) return

    hasRun.current = true
    setIsLoading(true)

    const syncUser = async () => {
      try {
        const synced = await upsertUserFn({
          data: {
            id: clerkUser.id,
            name: clerkUser.fullName || clerkUser.username || 'User',
            email: clerkUser.primaryEmailAddress?.emailAddress || '',
            avatar: clerkUser.imageUrl,
            role: 'user', // Default, will be ignored by upsert if user exists
          },
        })
        setSyncedUser(synced)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Failed to sync auth user:', error)
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
