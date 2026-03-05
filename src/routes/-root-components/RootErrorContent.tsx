import { useAuth, useUser } from '@clerk/tanstack-react-start'
import { useTranslation } from 'react-i18next'
import { isClientAuthBypassEnabled } from '@/shared/lib/auth/bypass.client'
import { ErrorStateView } from '@/shared/ui/feedback/ErrorStateView'

export function RootErrorContent({ error }: { error: Error }) {
  const auth = useAuth()
  const user = useUser()
  const { t } = useTranslation('errors')
  const isAuthBypassEnabled = isClientAuthBypassEnabled()

  const isAuthLoaded = auth && typeof auth.isLoaded !== 'undefined' ? auth.isLoaded : false
  const isUserLoaded = user && typeof user.isLoaded !== 'undefined' ? user.isLoaded : false
  const isLoaded = isAuthLoaded && isUserLoaded

  const isAuthenticated = isAuthBypassEnabled || !!auth?.userId
  const role = user?.user?.publicMetadata?.role as string

  return (
    <ErrorStateView
      title={t('boundary.title', '¡Ups! Algo salió mal')}
      description={t('boundary.description', 'Ha ocurrido un error inesperado.')}
      isAuthenticated={isAuthBypassEnabled || (isLoaded ? isAuthenticated : false)}
      errorDetails={error}
      userRole={role}
    />
  )
}
