import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { revenueTrendQueryOptions } from '../api/analytics.queries'

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
  }

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
          <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <AreaChart
              accessibilityLayer
              data={data}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                }}
              />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <defs>
                <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-expenses)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-expenses)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <Area
                dataKey="income"
                type="natural"
                fill="url(#fillIncome)"
                fillOpacity={0.4}
                stroke="var(--color-income)"
                stackId="a"
              />
              <Area
                dataKey="expenses"
                type="natural"
                fill="url(#fillExpenses)"
                fillOpacity={0.4}
                stroke="var(--color-expenses)"
                stackId="b"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
