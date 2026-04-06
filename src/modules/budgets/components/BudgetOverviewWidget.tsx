import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { WidgetRefreshButton, WidgetRefreshingIndicator } from '@/modules/core/widget'
import { cn } from '@/shared/lib/utils'
import { useMyBudgetsDashboard } from '../api/budgets.queries'
import { formatAmount } from '../model/period-utils'

const HEALTH_COLORS = {
  healthy: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950',
  on_track: 'text-blue-600 bg-blue-100 dark:bg-blue-950',
  warning: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950',
  approaching: 'text-orange-600 bg-orange-100 dark:bg-orange-950',
  over_budget: 'text-red-600 bg-red-100 dark:bg-red-950',
  no_limit: 'text-gray-500 bg-gray-100 dark:bg-gray-800',
} as const

const PROGRESS_COLORS = {
  healthy: '',
  on_track: '',
  warning: '[&>div]:bg-yellow-500',
  approaching: '[&>div]:bg-orange-500',
  over_budget: '[&>div]:bg-red-500',
  no_limit: '[&>div]:bg-gray-400',
} as const

export function BudgetOverviewWidget() {
  const { t } = useTranslation()
  const { data, isLoading, isFetching, refetch } = useMyBudgetsDashboard()

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  const budgets = (data?.budgets ?? []).slice(0, 5)

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-3 @md:flex-row @md:items-start @md:justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>{t('dashboard.widgets.budgetOverview', 'Budget Overview')}</CardTitle>
          <CardDescription>
            {t('dashboard.widgets.budgetOverviewDesc', 'Active budgets with spending progress.')}
          </CardDescription>
          {isFetching && (
            <div className="mt-1">
              <WidgetRefreshingIndicator />
            </div>
          )}
        </div>
        <WidgetRefreshButton
          isRefreshing={isFetching}
          onRefresh={() => void refetch()}
          label={t('budgets.widgets.refreshOverview', 'Refresh overview')}
        />
      </CardHeader>
      <CardContent>
        {budgets.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
            {t('budgets.overviewEmpty', 'No active budgets')}
          </div>
        ) : (
          <div className="space-y-4">
            {budgets.map((budget) => {
              const health = budget.health
              const pct = health?.usagePct ?? 0
              const status = health?.status ?? 'no_limit'
              return (
                <Link
                  key={budget.id}
                  to="/dashboard/budgets/$budgetId"
                  params={{ budgetId: budget.id }}
                  className="block space-y-1.5 rounded-lg p-2 -mx-2 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate">{budget.name}</span>
                    <span
                      className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded-full ml-2 shrink-0',
                        HEALTH_COLORS[status],
                      )}
                    >
                      {status === 'over_budget'
                        ? t('budgets.health.overBudget')
                        : status === 'no_limit'
                          ? t('budgets.health.noLimit')
                          : `${Math.round(pct)}%`}
                    </span>
                  </div>
                  <Progress
                    value={Math.min(100, pct)}
                    className={cn('h-1.5', PROGRESS_COLORS[status])}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatAmount(health?.spent ?? 0, budget.currency)}</span>
                    {health?.target !== null && health?.target !== undefined && (
                      <span>{formatAmount(health.target, budget.currency)}</span>
                    )}
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
