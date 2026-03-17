import { createServerFn } from '@tanstack/react-start'
import { getAuthUser, requireAuthUser } from './server'

export const getAppAuthSession = createServerFn({ method: 'GET' }).handler(async () => {
  return await getAuthUser()
})

export const ensureAppAuthSession = createServerFn({ method: 'GET' }).handler(async () => {
  return await requireAuthUser()
})
