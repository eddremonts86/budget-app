import { afterEach, describe, expect, it } from 'vitest'

const withEnv = (entries: Record<string, string | undefined>) => {
  const previous = Object.fromEntries(Object.keys(entries).map((key) => [key, process.env[key]]))
  for (const [key, value] of Object.entries(entries)) {
    if (typeof value === 'undefined') {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  }
  return () => {
    for (const [key, value] of Object.entries(previous)) {
      if (typeof value === 'undefined') {
        delete process.env[key]
      } else {
        process.env[key] = value
      }
    }
  }
}

describe('auth bypass server', () => {
  let restore = () => {}

  afterEach(() => {
    restore()
    restore = () => {}
  })

  it('returns default user id when ids are not configured', async () => {
    restore = withEnv({ TEST_USER_ID: undefined, VITE_TEST_USER_ID: undefined })
    const { getServerTestUserId } = await import('@/shared/lib/auth/bypass.server')

    expect(getServerTestUserId()).toBe('mock_user_id')
  })

  it('returns explicit TEST_USER_ID when configured', async () => {
    restore = withEnv({ TEST_USER_ID: 'srv-user-1', VITE_TEST_USER_ID: undefined })
    const { getServerTestUserId } = await import('@/shared/lib/auth/bypass.server')

    expect(getServerTestUserId()).toBe('srv-user-1')
  })

  it('disables bypass in production', async () => {
    restore = withEnv({
      NODE_ENV: 'production',
      HOST: 'localhost',
      SKIP_AUTH: 'true',
      VITE_SKIP_AUTH: undefined,
      VITE_E2E: undefined,
    })
    const { isServerAuthBypassEnabled } = await import('@/shared/lib/auth/bypass.server')

    expect(isServerAuthBypassEnabled()).toBe(false)
  })

  it('enables bypass in development on localhost with SKIP_AUTH', async () => {
    restore = withEnv({
      NODE_ENV: 'development',
      HOST: 'localhost',
      SKIP_AUTH: 'true',
      VITE_SKIP_AUTH: undefined,
      VITE_E2E: undefined,
    })
    const { isServerAuthBypassEnabled } = await import('@/shared/lib/auth/bypass.server')

    expect(isServerAuthBypassEnabled()).toBe(true)
  })

  it('enables bypass with host that includes a port', async () => {
    restore = withEnv({
      NODE_ENV: 'development',
      HOST: '127.0.0.1:3000',
      SKIP_AUTH: undefined,
      VITE_SKIP_AUTH: 'true',
      VITE_E2E: undefined,
    })
    const { isServerAuthBypassEnabled } = await import('@/shared/lib/auth/bypass.server')

    expect(isServerAuthBypassEnabled()).toBe(true)
  })

  it('disables bypass when no switch variable is set', async () => {
    restore = withEnv({
      NODE_ENV: 'development',
      HOST: 'localhost',
      SKIP_AUTH: undefined,
      VITE_SKIP_AUTH: undefined,
      VITE_E2E: undefined,
    })
    const { isServerAuthBypassEnabled } = await import('@/shared/lib/auth/bypass.server')

    expect(isServerAuthBypassEnabled()).toBe(false)
  })

  it('disables bypass when host is not local', async () => {
    restore = withEnv({
      NODE_ENV: 'development',
      HOST: 'example.com',
      SKIP_AUTH: 'true',
      VITE_SKIP_AUTH: undefined,
      VITE_E2E: undefined,
    })
    const { isServerAuthBypassEnabled } = await import('@/shared/lib/auth/bypass.server')

    expect(isServerAuthBypassEnabled()).toBe(false)
  })
})
