import axios from 'axios'
import { setupAuthInterceptor, setupErrorInterceptor } from './interceptors'

/**
 * Pre-configured Axios instance for API requests
 *
 * Features:
 * - Automatic auth token injection (Clerk)
 * - Error handling with Sentry logging
 * - Toast notifications for errors
 *
 * @example
 * ```ts
 * import { apiClient } from '@/shared/lib/api'
 *
 * // GET request
 * const { data } = await apiClient.get('/users')
 *
 * // POST request
 * const { data } = await apiClient.post('/users', { name: 'John Doe' })
 * ```
 */
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: import.meta.env.PROD ? 10000 : 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Setup interceptors
setupAuthInterceptor(apiClient)
setupErrorInterceptor(apiClient)
