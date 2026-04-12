import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { ChartConfig } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { taskCompletionTrendQueryOptions } from '../api/analytics.queries'
import { TaskCompletionChartContent } from './TaskCompletionChartContent'

interface TaskCompletionChartProps {
  days: number
}

export function TaskCompletionChart({ days }: TaskCompletionChartProps) {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery(taskCompletionTrendQueryOptions(days))

  const chartConfig = {
    count: {
      label: t('analytics.taskCompletionTrend.label', { defaultValue: 'Tasks Completed' }),
      color: '#16a34a',
    },
  } satisfies ChartConfig

  return (
    <Card className="col-span-4 lg:col-span-2">
      <CardHeader>
        <CardTitle>
          {t('analytics.taskCompletionTrend.title', { defaultValue: 'Task Completion Trend' })}
        </CardTitle>
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
          <TaskCompletionChartContent data={data ?? []} chartConfig={chartConfig} />
        )}
      </CardContent>
    </Card>
  )
}
