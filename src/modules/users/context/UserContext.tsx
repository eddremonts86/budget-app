import * as React from 'react'
import type { User } from '../model/types'
import type { AppRoleKey } from '../model/permissions'

export interface UserContextValue {
  syncedUserId: string | null
  userRole: 'admin' | 'user'
  roleKey: AppRoleKey
  canApproveTransactions: boolean
  user: User | null
  isReady: boolean
  isLoading: boolean
}

export const UserContext = React.createContext<UserContextValue | undefined>(undefined)
