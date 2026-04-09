import { IconBrain, IconCircleCheck, IconCircleX, IconLoader2, IconKey } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@/components/ui'
import type { AiProviderStatus } from '@/modules/ai/providers/types'
import { WidgetRefreshButton, WidgetRefreshingIndicator } from '@/modules/core/widget'
import { useAiProviderStatuses } from '@/modules/settings'
import { cn } from '@/shared/utils'

function StatusIcon({ status }: { status: AiProviderStatus['status'] }) {
  if (status === 'available') return <IconCircleCheck className="h-4 w-4 text-green-500" />
  if (status === 'auth_required') return <IconKey className="h-4 w-4 text-amber-500" />
  if (status === 'unreachable' || status === 'error')
    return <IconCircleX className="h-4 w-4 text-red-500" />
  return <IconLoader2 className="h-4 w-4 animate-spin text-muted-foreground" />
}

export function AiStatusWidget() {
  const { t } = useTranslation()
  const { data: statuses = [], isLoading, isFetching, refetch } = useAiProviderStatuses()

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-2/3 mt-2" />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  const available = statuses.filter((s: AiProviderStatus) => s.status === 'available').length

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-2 @md:flex-row @md:items-center @md:justify-between space-y-0 pb-3">
        <div className="min-w-0">
          <CardTitle className="flex items-center gap-2">
            <IconBrain className="h-4 w-4 text-primary" />
            {t('dashboard.widgets.aiStatus', 'AI Providers')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.widgets.aiStatusDesc', 'Connection status of configured AI providers.')}
          </CardDescription>
          {isFetching ? (
            <div className="mt-1">
              <WidgetRefreshingIndicator />
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <div className="text-2xl font-bold text-green-500">{available}</div>
            <div className="text-xs text-muted-foreground">
              {t('dashboard.widgets.aiOnline', 'online')}
            </div>
          </div>
          <WidgetRefreshButton
            isRefreshing={isFetching}
            onRefresh={() => {
              void refetch()
            }}
            label={t('dashboard.actions.refreshAiStatus', 'Refresh AI status')}
          />
        </div>
      </CardHeader>
      <CardContent>
        {statuses.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-muted-foreground text-sm">
            {t('common.noData', 'No data available')}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {statuses.map((provider: AiProviderStatus) => (
              <div
                key={provider.id}
                className={cn(
                  'flex items-center justify-between gap-2 rounded-md border px-3 py-2',
                  provider.status === 'available'
                    ? 'border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900'
                    : 'border-border bg-muted/20',
                )}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <StatusIcon status={provider.status} />
                  <span className="text-sm font-medium truncate">{provider.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {provider.status === 'available' && provider.latencyMs > 0 ? (
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {provider.latencyMs}ms
                    </span>
                  ) : null}
                  {provider.modelCount !== null &&
                  provider.modelCount !== undefined &&
                  provider.modelCount > 0 ? (
                    <span className="text-xs text-muted-foreground">
                      {provider.modelCount} {t('dashboard.widgets.models', 'models')}
                    </span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
