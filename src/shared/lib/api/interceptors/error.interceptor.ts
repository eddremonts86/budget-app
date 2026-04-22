import * as Sentry from '@sentry/react'
import type { AxiosError, AxiosInstance } from 'axios'
import { toast } from '@/shared/lib/toast'
import type { ApiError } from '../types'

/**
 * Map of HTTP status codes to user-friendly error messages
 */
const errorMessages: Record<number, string> = {
  400: 'Datos inválidos en la solicitud',
  401: 'Sesión expirada. Por favor inicia sesión nuevamente',
  403: 'No tienes permisos para realizar esta acción',
  404: 'El recurso solicitado no fue encontrado',
  409: 'Conflicto con el estado actual del recurso',
  422: 'Error de validación en los datos enviados',
  429: 'Demasiadas solicitudes. Intenta más tarde',
  500: 'Error interno del servidor. Intenta más tarde',
  502: 'Servicio temporalmente no disponible',
  503: 'Servicio en mantenimiento. Intenta más tarde',
}

/**
 * Interceptor to handle API errors with Sentry logging and toast notifications
 */
export function setupErrorInterceptor(client: AxiosInstance) {
  client.interceptors.response.use(
    // Success handler - pass through
    (response) => response,

    // Error handler
    (error: AxiosError<ApiError>) => {
      const status = error.response?.status
      const serverMessage = error.response?.data?.message
      const code = error.response?.data?.code

      // Determine the message to show
      let displayMessage = serverMessage || errorMessages[status ?? 0] || error.message

      // Handle specific network errors
      if (!status) {
        if (error.message === 'Network Error') {
          displayMessage = 'Error de conexión. Revisa tu internet'
        } else if (error.code === 'ECONNABORTED') {
          displayMessage = 'La solicitud tardó demasiado tiempo'
        }
      }

      // Show toast notification
      toast.error(displayMessage, {
        description: code ? `Código: ${code}` : undefined,
        duration: 5000,
      })

      // Log to Sentry for server errors (5xx) and unexpected errors
      // Skip logging for expected client errors (401, 403, 404, 422)
      const skipSentryStatuses = [401, 403, 404, 422]
      if (status && !skipSentryStatuses.includes(status)) {
        Sentry.captureException(error, {
          tags: {
            type: 'api_error',
            status: String(status),
            code: code ?? 'unknown',
          },
          extra: {
            url: error.config?.url,
            method: error.config?.method?.toUpperCase(),
            response: error.response?.data,
            // requestData intentionally omitted — may contain passwords or PII
          },
        })
      }

      return Promise.reject(error)
    },
  )
}
