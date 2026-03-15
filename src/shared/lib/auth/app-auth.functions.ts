import { createServerFn } from '@tanstack/react-start'

async function loadServerAuthModule() {
  const modulePath = './server'
  return await import(/* @vite-ignore */ modulePath)
}

export const getAppAuthSession = createServerFn({ method: 'GET' }).handler(async () => {
  const { getAuthUser } = await loadServerAuthModule()
  return await getAuthUser()
})

export const ensureAppAuthSession = createServerFn({ method: 'GET' }).handler(async () => {
  const { requireAuthUser } = await loadServerAuthModule()
  return await requireAuthUser()
})
