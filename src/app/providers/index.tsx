import type { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { I18nProvider } from './i18n-provider'
import { QueryProvider } from './query-provider'
import { ThemeProvider } from './theme-provider'

interface AppProvidersProps {
  children: ReactNode
}

/**
 * Root providers wrapper that includes all necessary context providers
 * Order matters: outermost providers should be the most "global"
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <I18nProvider>
      <ThemeProvider defaultTheme="system">
        <QueryProvider>
          {children}
          <Toaster
            position="top-right"
            expand
            richColors
            closeButton
            toastOptions={{
              duration: 4000,
            }}
          />
        </QueryProvider>
      </ThemeProvider>
    </I18nProvider>
  )
}

export { I18nProvider } from './i18n-provider'
export { QueryProvider } from './query-provider'
export { ThemeProvider, useTheme } from './theme-provider'
