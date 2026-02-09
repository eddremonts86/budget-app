import * as Sentry from '@sentry/react'
import { QueryClient } from '@tanstack/react-query'

function handleQueryError(error: unknown) {
  // eslint-disable-next-line no-console
  console.error('Query error:', error)

  Sentry.captureException(error, {
    tags: { type: 'query_error' },
  })
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
      onError: handleQueryError,
    },
  },
})
