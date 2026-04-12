import { useTranslation } from 'react-i18next'
import { useAppAuth } from '@/shared/lib/auth/app-auth'
import { isClientAuthBypassEnabled } from '@/shared/lib/auth/bypass'
import { ErrorStateView } from '@/shared/ui/feedback/ErrorStateView'

export function RootErrorContent({ error }: { error: Error }) {
  const auth = useAppAuth()
  const { t } = useTranslation('errors')
  const isAuthBypassEnabled = isClientAuthBypassEnabled()

  const isAuthenticated = isAuthBypassEnabled || auth.isAuthenticated
  const role = auth.user?.role ?? undefined

  return (
    <ErrorStateView
      title={t('boundary.title', '¡Ups! Algo salió mal')}
      description={t('boundary.description', 'Ha ocurrido un error inesperado.')}
      isAuthenticated={isAuthBypassEnabled || (auth.isLoaded ? isAuthenticated : false)}
      errorDetails={error}
      userRole={role}
    />
  )
}
