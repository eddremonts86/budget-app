import { auth } from '@clerk/tanstack-react-start/server'

export const getAuthUser = async () => {
  if (process.env.VITE_E2E === 'true') {
    return {
      userId: 'user_e2e_local',
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
