import * as React from 'react'
import { UserContext } from '../context/UserContext'

export function useCurrentUser() {
  const context = React.useContext(UserContext)
  if (context === undefined) {
    throw new Error('useCurrentUser must be used within a UserProvider')
  }
  return context
}
