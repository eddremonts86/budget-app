import { ClerkProvider } from '@clerk/tanstack-react-start'
import type { ReactNode } from 'react'
import { Toaster } from 'sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { I18nProvider } from './i18n-provider'
import { QueryProvider } from './query-provider'
import { ThemeProvider } from './theme-provider'

interface AppProvidersProps {
  children: ReactNode
}

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY')
}

/**
 * Root providers wrapper that includes all necessary context providers
 * Order matters: outermost providers should be the most "global"
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
      <I18nProvider>
        <ThemeProvider defaultTheme="system">
          <QueryProvider>
            <TooltipProvider>{children}</TooltipProvider>
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
    </ClerkProvider>
  )
}

export { I18nProvider } from './i18n-provider'
export { QueryProvider } from './query-provider'
export { ThemeProvider } from './theme-provider'
