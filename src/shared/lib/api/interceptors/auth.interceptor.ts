import type { AxiosInstance } from 'axios'

/**
 * Interceptor to inject Clerk authentication token
 */
export function setupAuthInterceptor(client: AxiosInstance) {
  client.interceptors.request.use(async (config) => {
    // Get token from Clerk if available (browser only)
    if (typeof window !== 'undefined') {
      try {
        // @ts-expect-error - Clerk adds this to window
        const clerk = window.Clerk
        if (clerk?.session) {
          const token = await clerk.session.getToken()
          if (token) {
            config.headers.Authorization = `Bearer ${token}`
          }
        }
      } catch (error) {
        // eslint-disable-next-line no-console
        console.warn('Failed to fetch Clerk token:', error)
      }
    }

    return config
  })
}
