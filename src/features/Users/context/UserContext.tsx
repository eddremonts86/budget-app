import * as React from 'react'
import type { User } from '../model/types'

export interface UserContextValue {
  syncedUserId: string | null
  userRole: 'admin' | 'user'
  user: User | null
  isReady: boolean
  isLoading: boolean
}

export const UserContext = React.createContext<UserContextValue | undefined>(undefined)

export * from './UserProvider'
