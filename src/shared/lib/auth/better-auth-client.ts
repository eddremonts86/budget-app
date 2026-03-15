import { createAuthClient } from 'better-auth/react'
import { getBetterAuthUrl } from './config'

export const authClient = createAuthClient({
  baseURL: getBetterAuthUrl(),
})

export const { signIn, signOut, signUp, useSession } = authClient
