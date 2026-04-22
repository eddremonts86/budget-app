import { Suspense, lazy, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { getWidgetById } from '../registry/widget-registry'

interface WidgetRendererProps {
  widgetId: string
  fallback?: React.ReactNode
}

export function WidgetRenderer({ widgetId, fallback }: WidgetRendererProps) {
  const { t } = useTranslation()
  const widget = getWidgetById(widgetId)

  const LazyComponent = useMemo(() => {
    if (!widget) return null
    return lazy(widget.component)
  }, [widget])

  if (!widget || !LazyComponent) {
    return null
  }

  const defaultFallback = (
    <div className="h-48 w-full rounded-xl border border-border/40 bg-card animate-pulse flex items-center justify-center text-sm text-muted-foreground">
      {t('common.loading', 'Loading...')}
    </div>
  )

  return (
    <Suspense fallback={fallback ?? defaultFallback}>
      {/* eslint-disable-next-line react-hooks/static-components */}
      <LazyComponent />
    </Suspense>
  )
}
