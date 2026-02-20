import { auth } from '@clerk/tanstack-react-start/server'

export const getAuthUser = async () => {
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
