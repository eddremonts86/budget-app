import * as Sentry from '@sentry/react'
import axios from 'axios'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setupErrorInterceptor } from '@/shared/lib/api/interceptors/error.interceptor'
import { toast } from '@/shared/lib/toast'

vi.mock('@/shared/lib/toast', () => ({
  toast: {
    error: vi.fn(),
  },
}))

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
}))

describe('errorInterceptor', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show toast and report to Sentry for 500 errors', async () => {
    const testClient = axios.create()
    setupErrorInterceptor(testClient)

    const errorResponse = {
      status: 500,
      data: { message: 'Server Error', code: 'INTERNAL_ERROR' },
      config: { url: '/test', method: 'get' },
    }

    const handlers = (
      testClient.interceptors.response as unknown as {
        handlers: { rejected: (err: unknown) => Promise<unknown> }[]
      }
    ).handlers
    try {
      await handlers[0].rejected({
        response: errorResponse,
        config: errorResponse.config,
        message: 'Request failed',
      })
    } catch {
      // Expected to throw
    }

    expect(toast.error).toHaveBeenCalledWith(
      'Server Error',
      expect.objectContaining({
        description: 'Código: INTERNAL_ERROR',
      }),
    )
    expect(Sentry.captureException).toHaveBeenCalled()
  })

  it('should show friendly message for 401 errors and NOT report to Sentry', async () => {
    const testClient = axios.create()
    setupErrorInterceptor(testClient)

    const errorResponse = {
      status: 401,
      data: {}, // No message from server
      config: { url: '/test', method: 'get' },
    }

    const handlers = (
      testClient.interceptors.response as unknown as {
        handlers: { rejected: (err: unknown) => Promise<unknown> }[]
      }
    ).handlers
    try {
      await handlers[0].rejected({
        response: errorResponse,
        config: errorResponse.config,
        message: 'Unauthorized',
      })
    } catch {
      // Expected to throw
    }

    expect(toast.error).toHaveBeenCalledWith(
      'Sesión expirada. Por favor inicia sesión nuevamente',
      expect.anything(),
    )
    expect(Sentry.captureException).not.toHaveBeenCalled()
  })

  it('should use default axios error message if no status or server message', async () => {
    const testClient = axios.create()
    setupErrorInterceptor(testClient)

    const handlers = (
      testClient.interceptors.response as unknown as {
        handlers: { rejected: (err: unknown) => Promise<unknown> }[]
      }
    ).handlers
    try {
      await handlers[0].rejected({
        message: 'Network Error',
        config: { url: '/test', method: 'get' },
      })
    } catch {
      // Expected to throw
    }

    expect(toast.error).toHaveBeenCalledWith(
      'Error de conexión. Revisa tu internet',
      expect.anything(),
    )
  })
})
