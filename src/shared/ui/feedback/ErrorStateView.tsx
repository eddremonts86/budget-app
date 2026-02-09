import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, ChevronDown, Home, RefreshCcw, Lock } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui'

export interface ErrorStateViewProps {
  /** The error title to display */
  title: string
  /** The error description to display */
  description: string
  /** Whether the user is authenticated */
  isAuthenticated: boolean
  /** Optional technical details (error object or string) */
  errorDetails?: Error | string | null
  /** Optional role information for debugging/display */
  userRole?: string
  /** Custom icon to override the default AlertCircle */
  icon?: React.ReactNode
  /** Whether to show recovery actions (home, retry) */
  showRecoveryActions?: boolean
  /** Custom error message for unauthenticated users */
  unauthMessage?: string
}

/**
 * Reusable presentation component for error states.
 * Handles both authenticated and unauthenticated states with appropriate messaging.
 */
export function ErrorStateView({
  title,
  description,
  isAuthenticated,
  errorDetails,
  userRole,
  icon,
  showRecoveryActions = true,
  unauthMessage,
}: ErrorStateViewProps) {
  const [showDetails, setShowDetails] = useState(false)
  const { t } = useTranslation('errors')

  const errorMessage = typeof errorDetails === 'string' ? errorDetails : errorDetails?.message
  const stackTrace = errorDetails instanceof Error ? errorDetails.stack : undefined

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white p-4 text-center text-slate-900 dark:bg-slate-950 dark:text-slate-50">
      <div className="w-full max-w-md space-y-8">
        {/* Icon section */}
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
          <div className="relative z-10">
            {icon ||
              (isAuthenticated ? (
                <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
              ) : (
                <Lock className="h-12 w-12 text-red-600 dark:text-red-400" />
              ))}
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.2 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
            className="absolute inset-0 rounded-full bg-red-500/10"
          />
        </div>

        {/* Text content */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {isAuthenticated ? title : t('boundary.unauthenticatedTitle', 'Acceso restringido')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {isAuthenticated
              ? description
              : unauthMessage ||
                t(
                  'boundary.unauthenticatedDescription',
                  'Por favor, inicia sesión para ver este contenido.',
                )}
          </p>
          {userRole && isAuthenticated && (
            <p className="text-[10px] uppercase tracking-widest opacity-50">Role: {userRole}</p>
          )}
        </div>

        {/* Recovery buttons */}
        {showRecoveryActions && (
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              asChild
              variant="default"
              size="lg"
              className="gap-2 shadow-lg shadow-primary/20 transition-transform hover:scale-105 active:scale-95"
            >
              <a href="/">
                <Home className="h-4 w-4" />
                {t('boundary.goHome', 'Ir al inicio')}
              </a>
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="gap-2 transition-transform hover:scale-105 active:scale-95"
              onClick={() => window.location.reload()}
            >
              <RefreshCcw className="h-4 w-4" />
              {t('boundary.retry', 'Reintentar')}
            </Button>
          </div>
        )}

        {/* Technical details (only for authenticated users and if details exist) */}
        {isAuthenticated && errorMessage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="pt-4"
          >
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="group flex w-full items-center justify-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {showDetails ? t('boundary.hideDetails') : t('boundary.showDetails')}
              <ChevronDown
                className={`h-3 w-3 transition-transform duration-300 ${
                  showDetails ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="mt-4 overflow-hidden"
                >
                  <div className="rounded-lg border bg-muted/50 p-4 text-left shadow-inner">
                    <p className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {t('boundary.errorMessage')}
                    </p>
                    <code className="block break-all font-mono text-xs text-destructive">
                      {errorMessage}
                    </code>
                    {stackTrace && (
                      <>
                        <p className="mb-2 mt-4 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {t('boundary.stackTrace')}
                        </p>
                        <pre className="max-h-40 overflow-auto whitespace-pre-wrap font-mono text-[10px] text-muted-foreground/80 scrollbar-thin scrollbar-thumb-muted-foreground/20">
                          {stackTrace}
                        </pre>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  )
}
