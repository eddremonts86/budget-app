import { describe, expect, it } from 'vitest'
import { getClientTestUserId, isClientAuthBypassEnabled } from '@/shared/lib/auth/bypass'

describe('auth bypass client', () => {
  it('returns default test user id when missing env value', () => {
    const userId = getClientTestUserId({
      DEV: true,
    })

    expect(userId).toBe('mock_user_id')
  })

  it('returns configured test user id', () => {
    const userId = getClientTestUserId({
      DEV: true,
      VITE_TEST_USER_ID: 'custom-user',
    })

    expect(userId).toBe('custom-user')
  })

  it('disables bypass outside dev mode', () => {
    const enabled = isClientAuthBypassEnabled({
      env: {
        DEV: false,
        VITE_SKIP_AUTH: 'true',
      },
      hostname: 'localhost',
      ssr: false,
    })

    expect(enabled).toBe(false)
  })

  it('enables bypass for SSR when switch is active', () => {
    const enabled = isClientAuthBypassEnabled({
      env: {
        DEV: true,
        VITE_SKIP_AUTH: 'true',
      },
      ssr: true,
    })

    expect(enabled).toBe(true)
  })

  it('enables bypass for localhost when switch is active', () => {
    const enabled = isClientAuthBypassEnabled({
      env: {
        DEV: true,
        VITE_SKIP_AUTH: 'true',
      },
      hostname: 'localhost',
      ssr: false,
    })

    expect(enabled).toBe(true)
  })

  it('enables bypass for 127.0.0.1 when switch is active', () => {
    const enabled = isClientAuthBypassEnabled({
      env: {
        DEV: true,
        VITE_E2E: 'true',
      },
      hostname: '127.0.0.1',
      ssr: false,
    })

    expect(enabled).toBe(true)
  })

  it('disables bypass for non-local host', () => {
    const enabled = isClientAuthBypassEnabled({
      env: {
        DEV: true,
        VITE_SKIP_AUTH: 'true',
      },
      hostname: 'example.com',
      ssr: false,
    })

    expect(enabled).toBe(false)
  })

  it('disables bypass when no switch is active', () => {
    const enabled = isClientAuthBypassEnabled({
      env: {
        DEV: true,
      },
      hostname: 'localhost',
      ssr: false,
    })

    expect(enabled).toBe(false)
  })
})
