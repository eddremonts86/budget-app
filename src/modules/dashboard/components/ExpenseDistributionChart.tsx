import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import type { ChartConfig } from '@/components/ui/chart'
import { useExpenseDistribution } from '../api/dashboard.queries'
import { WidgetRefreshButton, WidgetRefreshingIndicator } from './WidgetControls'

const LazyExpenseDistributionChartContent = React.lazy(() =>
  import('./ExpenseDistributionChartContent').then((module) => ({
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
          <div className="h-6 w-1/3 bg-muted rounded animate-pulse" />
          <div className="h-4 w-1/4 bg-muted rounded animate-pulse mt-2" />
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  const data = Array.isArray(distribution) ? [...distribution] : []

  // Sort data by amount descending
  data.sort((a, b) => b.amount - a.amount)

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
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          {t('common.noData', 'No data available')}
        </CardContent>
      </Card>
    )
  }

  const total = data.reduce((acc, item) => acc + item.amount, 0)

  const chartData = data.map((item) => ({
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
          fallback={<div className="h-[350px] w-full rounded-lg bg-muted/50 animate-pulse" />}
        >
          <LazyExpenseDistributionChartContent chartData={chartData} chartConfig={chartConfig} />
        </React.Suspense>
      </CardContent>
    </Card>
  )
}
