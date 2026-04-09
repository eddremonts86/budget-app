import type { AxiosInstance } from 'axios'

/**
 * Keep API requests compatible with cookie-based auth sessions.
 */
export function setupAuthInterceptor(client: AxiosInstance) {
  client.defaults.withCredentials = true

  client.interceptors.request.use((config) => {
    config.withCredentials ??= true

    return config
  })
}
