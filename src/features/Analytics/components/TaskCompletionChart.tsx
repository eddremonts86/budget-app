import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { taskCompletionTrendQueryOptions } from '../api/analytics.queries'

interface TaskCompletionChartProps {
  days: number
}

export function TaskCompletionChart({ days }: TaskCompletionChartProps) {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery(taskCompletionTrendQueryOptions(days))

  const chartConfig = {
    count: {
      label: t('analytics.taskCompletionTrend.label', { defaultValue: 'Tasks Completed' }),
      color: "#16a34a",
    },
  }

  return (
    <Card className="col-span-4 lg:col-span-2">
      <CardHeader>
        <CardTitle>{t('analytics.taskCompletionTrend.title', { defaultValue: 'Task Completion Trend' })}</CardTitle>
        <CardDescription>
          {t('analytics.taskCompletionTrend.description', {
            defaultValue: 'Tasks completed over the last {{days}} days',
            days,
          })}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <BarChart
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
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
