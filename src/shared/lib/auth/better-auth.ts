import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { getDb } from '@/shared/lib/db/index'
import { authAccounts, authSessions, authUsers, authVerifications } from '@/shared/lib/db/schema'
import { getBetterAuthSecret, getBetterAuthUrl } from './config'

const db = getDb()

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: authUsers,
      session: authSessions,
      account: authAccounts,
      verification: authVerifications,
    },
  }),
  baseURL: getBetterAuthUrl(),
  secret: getBetterAuthSecret(),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [tanstackStartCookies()],
})
