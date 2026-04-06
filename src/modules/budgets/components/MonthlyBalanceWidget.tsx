import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { WidgetRefreshButton, WidgetRefreshingIndicator } from '@/modules/core/widget'
import { cn } from '@/shared/lib/utils'
import { useMyBudgetsDashboard } from '../api/budgets.queries'
import { formatAmount } from '../model/period-utils'

export function MonthlyBalanceWidget() {
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
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    )
  }

  const balance = data?.totalBalance ?? 0
  const income = data?.totalIncome ?? 0
  const expenses = data?.totalExpenses ?? 0
  const isPositive = balance >= 0

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-3 @md:flex-row @md:items-start @md:justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>{t('dashboard.widgets.monthlyBalance', 'Monthly Balance')}</CardTitle>
          <CardDescription>
            {t('dashboard.widgets.monthlyBalanceDesc', 'Net income vs expenses this period.')}
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
          label={t('budgets.widgets.refreshBalance', 'Refresh balance')}
        />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">{t('budgets.summary.balance')}</p>
          <p
            className={cn(
              'text-3xl font-bold tabular-nums',
              isPositive ? 'text-emerald-600' : 'text-red-600',
            )}
          >
            {isPositive ? '+' : ''}
            {formatAmount(balance, 'USD')}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/30 p-3 text-center">
            <p className="text-xs text-muted-foreground">{t('budgets.summary.income')}</p>
            <p className="text-sm font-semibold text-emerald-600">{formatAmount(income, 'USD')}</p>
          </div>
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 p-3 text-center">
            <p className="text-xs text-muted-foreground">{t('budgets.summary.expenses')}</p>
            <p className="text-sm font-semibold text-red-600">{formatAmount(expenses, 'USD')}</p>
          </div>
        </div>
        {(data?.overBudgetCount ?? 0) > 0 && (
          <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-3 py-2 text-center">
            <p className="text-xs text-red-600 font-medium">
              ⚠ {data?.overBudgetCount} {t('budgets.alerts.overBudget')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
