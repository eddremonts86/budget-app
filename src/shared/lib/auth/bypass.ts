const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0'])

const isTruthy = (value?: string) => value === 'true' || value === '1'

interface ClientBypassEnv {
  DEV: boolean
  VITE_SKIP_AUTH?: string
  VITE_E2E?: string
  VITE_TEST_USER_ID?: string
}

interface ClientBypassOptions {
  env?: ClientBypassEnv
  hostname?: string
  ssr?: boolean
}

const getClientEnv = (): ClientBypassEnv => ({
  DEV: import.meta.env.DEV,
  VITE_SKIP_AUTH: import.meta.env.VITE_SKIP_AUTH,
  VITE_E2E: import.meta.env.VITE_E2E,
  VITE_TEST_USER_ID: import.meta.env.VITE_TEST_USER_ID,
})

export const getClientTestUserId = (env: ClientBypassEnv = getClientEnv()) =>
  env.VITE_TEST_USER_ID || 'mock_user_id'

export const isClientAuthBypassEnabled = (options: ClientBypassOptions = {}) => {
  const env = options.env ?? getClientEnv()

  if (!env.DEV) {
    return false
  }

  const skipAuth = isTruthy(env.VITE_SKIP_AUTH) || isTruthy(env.VITE_E2E)

  if (!skipAuth) {
    return false
  }

  const isServerRender = options.ssr ?? typeof window === 'undefined'

  if (isServerRender) {
    return true
  }

  const hostname = options.hostname ?? window.location.hostname
  const isLocalHost = LOCAL_HOSTS.has(hostname)

  return isLocalHost
}
