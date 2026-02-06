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
        const token = await window.Clerk?.session?.getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch {
        // Silent fail - user might not be authenticated
      }
    }

    return config
  })
}
