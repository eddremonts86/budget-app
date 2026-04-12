import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ChartConfig } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { revenueTrendQueryOptions } from '../api/analytics.queries'
import { RevenueChartContent } from './RevenueChartContent'

interface RevenueChartProps {
  days: number
}

export function RevenueChart({ days }: RevenueChartProps) {
  const { t } = useTranslation()
  const { data, isLoading, error } = useQuery(revenueTrendQueryOptions(days))

  const chartConfig = {
    income: {
      label: t('analytics.financialTrend.income', { defaultValue: 'Income' }),
      color: '#10b981', // Emerald-500
    },
    expenses: {
      label: t('analytics.financialTrend.expenses', { defaultValue: 'Expenses' }),
      color: '#ef4444', // Red-500
    },
  } satisfies ChartConfig

  if (error) {
    return (
      <Card className="col-span-4 lg:col-span-2">
        <CardHeader>
          <CardTitle>
            {t('analytics.financialTrend.title', { defaultValue: 'Financial Trend' })}
          </CardTitle>
          <CardDescription>
            {t('analytics.financialTrend.description', {
              defaultValue: 'Income and expenses over the last {{days}} days',
              days,
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-red-500">
            {t('analytics.financialTrend.error', { defaultValue: 'Error loading financial data' })}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-4 lg:col-span-2">
      <CardHeader>
        <CardTitle>
          {t('analytics.financialTrend.title', { defaultValue: 'Financial Trend' })}
        </CardTitle>
        <CardDescription>
          {t('analytics.financialTrend.description', {
            defaultValue: 'Income and expenses over the last {{days}} days',
            days,
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <RevenueChartContent data={data ?? []} chartConfig={chartConfig} />
        )}
      </CardContent>
    </Card>
  )
}
