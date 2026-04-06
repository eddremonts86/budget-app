import { ClerkProvider } from '@clerk/tanstack-react-start'
import { LazyMotion, domAnimation } from 'framer-motion'
import { NuqsAdapter } from 'nuqs/adapters/tanstack-router'
import type { ReactNode } from 'react'
import { Toaster } from '@/components/ui/toaster'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppAuthProvider } from '@/shared/lib/auth/app-auth'
import { getClerkPublishableKey, isClerkEnabled } from '@/shared/lib/auth/config'
import { I18nProvider } from './i18n-provider'
import { QueryProvider } from './query-provider'
import { ThemeProvider } from './theme-provider'

interface AppProvidersProps {
  children: ReactNode
}

const PUBLISHABLE_KEY = getClerkPublishableKey()
const SHOULD_USE_CLERK_PROVIDER = isClerkEnabled() && !!PUBLISHABLE_KEY

function ProvidersContent({ children }: AppProvidersProps) {
  return (
    <NuqsAdapter>
      <LazyMotion features={domAnimation}>
        <I18nProvider>
          <ThemeProvider defaultTheme="system">
            <QueryProvider>
              <AppAuthProvider>
                <TooltipProvider>{children}</TooltipProvider>
                <Toaster />
              </AppAuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </I18nProvider>
      </LazyMotion>
    </NuqsAdapter>
  )
}

/**
 * Root providers wrapper that includes all necessary context providers
 * Order matters: outermost providers should be the most "global"
 */
export function AppProviders({ children }: AppProvidersProps) {
  if (SHOULD_USE_CLERK_PROVIDER && PUBLISHABLE_KEY) {
    return (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
        <ProvidersContent>{children}</ProvidersContent>
      </ClerkProvider>
    )
  }

  return <ProvidersContent>{children}</ProvidersContent>
}
