import * as Sentry from '@sentry/react'

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN

export function initSentry() {
  if (!SENTRY_DSN) {
    // eslint-disable-next-line no-console
    console.info('Sentry DSN not configured, skipping initialization')
    return
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Filter out common network errors and noise
    ignoreErrors: [
      // Network connectivity issues
      'net::ERR_NAME_NOT_RESOLVED',
      'net::ERR_NETWORK_CHANGED',
      'net::ERR_INTERNET_DISCONNECTED',
      'net::ERR_CONNECTION_REFUSED',
      'net::ERR_CONNECTION_RESET',
      'Network Error',
      'Failed to fetch',
      'Load failed',
      'net::ERR_ABORTED',
      // Clerk telemetry and noise
      'clerk-telemetry',
    ],
    denyUrls: [
      // Ignore errors from these domains
      /clerk-telemetry\.com/i,
      /extensions\//i,
      /^chrome:\/\//i,
    ],
  })
}

export { Sentry }
