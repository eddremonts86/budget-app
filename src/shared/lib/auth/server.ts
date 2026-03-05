import { auth } from '@clerk/tanstack-react-start/server'
import { getServerTestUserId, isServerAuthBypassEnabled } from './bypass.server'

export const getAuthUser = async () => {
  if (isServerAuthBypassEnabled()) {
    const userId = getServerTestUserId()
    return {
      userId,
      sessionClaims: {
        publicMetadata: {
          role: 'admin',
        },
      },
    }
  }
  const user = await auth()
  return user
}

export const requireAuth = async () => {
  const { userId } = await getAuthUser()

  if (!userId) {
    throw new Error('Unauthorized')
  }

  return userId
}
