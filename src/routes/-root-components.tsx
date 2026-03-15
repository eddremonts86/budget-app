import * as Sentry from '@sentry/react'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { HeadContent, Scripts } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import * as React from 'react'
import { useDevtoolsVisibility } from '@/modules/settings'
import { AppProviders } from '@/shared/providers'
import { RootErrorContent } from './-root-components/RootErrorContent'

const ReactQueryDevtools = React.lazy(() =>
  import('@tanstack/react-query-devtools').then((d) => ({
    default: d.ReactQueryDevtools,
  })),
)

function DevtoolsWrapper() {
  const visible = useDevtoolsVisibility()

  if (!visible) return null

  return (
    <>
      <TanStackDevtools
        config={{
          position: 'bottom-right',
        }}
        plugins={[
          {
            name: 'TanStack Router',
            render: <TanStackRouterDevtoolsPanel />,
          },
        ]}
      />
      <React.Suspense fallback={null}>
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      </React.Suspense>
    </>
  )
}

export function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased" suppressHydrationWarning>
        <AppProviders>
          {children}
          <DevtoolsWrapper />
        </AppProviders>
        <Scripts />
      </body>
    </html>
  )
}

export function RootErrorBoundary({ error }: { error: Error }) {
  // Log error to Sentry
  Sentry.captureException(error)

  return <RootErrorContent error={error} />
}
