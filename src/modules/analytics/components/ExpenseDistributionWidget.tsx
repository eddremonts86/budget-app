import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@/components/ui'
import type { ChartConfig } from '@/components/ui/chart'
import { useExpenseDistribution } from '../api/analytics.queries'
import { WidgetRefreshButton, WidgetRefreshingIndicator } from '@/modules/core/widget'

const LazyExpenseDistributionChartContent = React.lazy(() =>
  import('./ExpenseDistributionWidgetContent').then((module) => ({
    default: module.ExpenseDistributionChartContent,
  })),
)

export function ExpenseDistributionChart() {
  const { t } = useTranslation()
  const { data: distribution, isLoading, isFetching, refetch } = useExpenseDistribution()

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/4 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-56 w-full" />
        </CardContent>
      </Card>
    )
  }

  const data = Array.isArray(distribution) ? [...distribution] : []

  // Sort data by amount descending and limit to top 10
  data.sort((a, b) => b.amount - a.amount)
  const topData = data.slice(0, 10)

  if (data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('dashboard.expenseDistribution.title', 'Expense Distribution')}</CardTitle>
          <CardDescription>
            {t(
              'dashboard.expenseDistribution.description',
              'Distribution of project expenses by category.',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-56 flex items-center justify-center text-muted-foreground">
          {t('common.noData', 'No data available')}
        </CardContent>
      </Card>
    )
  }

  const total = topData.reduce((acc, item) => acc + item.amount, 0)

  const chartData = topData.map((item) => ({
    category: item.category,
    amount: item.amount,
    percentage: ((item.amount / total) * 100).toFixed(1),
    color: item.color || '#3b82f6',
  }))

  const chartConfig = chartData.reduce((acc, item) => {
    acc[item.category] = {
      label: item.category,
      color: item.color,
    }
    return acc
  }, {} as ChartConfig)

  const chartHeight = Math.max(200, chartData.length * 36)

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('dashboard.expenseDistribution.title', 'Expense Distribution')}</CardTitle>
          <CardDescription>
            {t(
              'dashboard.expenseDistribution.description',
              'Distribution of project expenses by category.',
            )}
          </CardDescription>
          {isFetching ? (
            <div className="mt-1">
              <WidgetRefreshingIndicator />
            </div>
          ) : null}
        </div>
        <div className="flex items-start gap-2">
          <div className="text-right">
            <div className="text-2xl font-bold">${total.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">
              {t('dashboard.stats.totalExpenses', 'Total Expenses')}
            </div>
          </div>
          <WidgetRefreshButton
            isRefreshing={isFetching}
            onRefresh={() => {
              void refetch()
            }}
            label={t('dashboard.actions.refreshExpenseDistribution', {
              defaultValue: 'Refresh expense distribution',
            })}
          />
        </div>
      </CardHeader>
      <CardContent>
        <React.Suspense
          fallback={<Skeleton className="w-full" style={{ height: `${chartHeight}px` }} />}
        >
          <LazyExpenseDistributionChartContent
            chartData={chartData}
            chartConfig={chartConfig}
            height={chartHeight}
          />
        </React.Suspense>
      </CardContent>
    </Card>
  )
}
