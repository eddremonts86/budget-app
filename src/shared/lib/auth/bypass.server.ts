const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0'])

const isTruthy = (value?: string) => value === 'true' || value === '1'

const isLocalServerHost = () => {
  const host = process.env.HOST
  if (!host) {
    return true
  }

  const normalizedHost = host.split(':')[0]
  return LOCAL_HOSTS.has(normalizedHost)
}

export const getServerTestUserId = () =>
  process.env.TEST_USER_ID || process.env.VITE_TEST_USER_ID || 'mock_user_id'

export const isServerAuthBypassEnabled = () => {
  const skipAuth =
    isTruthy(process.env.SKIP_AUTH) ||
    isTruthy(process.env.VITE_SKIP_AUTH) ||
    isTruthy(process.env.VITE_E2E)

  return process.env.NODE_ENV !== 'production' && isLocalServerHost() && skipAuth
}
