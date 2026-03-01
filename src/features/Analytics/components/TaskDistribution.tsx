import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { taskDistributionQueryOptions } from '../api/analytics.queries'

export function TaskDistribution() {
  const { t } = useTranslation()
  const { data, isLoading, error } = useQuery(taskDistributionQueryOptions)

  const translatedData = useMemo(() => {
    if (!data) return null
    return {
      byStatus: data.byStatus.map((item) => ({
        ...item,
        originalName: item.name,
        name: t(
          `todos.status.${item.name.replace(/_([a-z])/g, (g) => g[1].toUpperCase())}`,
          item.name,
        ),
      })),
      byPriority: data.byPriority.map((item) => ({
        ...item,
        originalName: item.name,
        name: t(`todos.priority.${item.name}`, item.name),
      })),
    }
  }, [data, t])

  const statusConfig = {
    count: {
      label: t('analytics.taskDistribution.label', { defaultValue: 'Tasks' }),
      color: '#3b82f6',
    },
    ...Object.fromEntries(
      (data?.byStatus || []).map((item) => [
        item.name,
        {
          label: t(
            `todos.status.${item.name.replace(/_([a-z])/g, (g) => g[1].toUpperCase())}`,
            item.name,
          ),
        },
      ]),
    ),
  }

  const priorityConfig = {
    count: {
      label: t('analytics.taskDistribution.label', { defaultValue: 'Tasks' }),
      color: '#ef4444',
    },
    ...Object.fromEntries(
      (data?.byPriority || []).map((item) => [
        item.name,
        {
          label: t(`todos.priority.${item.name}`, item.name),
        },
      ]),
    ),
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[300px]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {t('analytics.taskDistribution.byStatus', { defaultValue: 'Tasks by Status' })}
            </CardTitle>
            <CardDescription>
              {t('analytics.taskDistribution.byStatusDesc', {
                defaultValue: 'Current distribution of tasks',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center text-red-500">
              {t('analytics.taskDistribution.error', { defaultValue: 'Error loading task data' })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>
              {t('analytics.taskDistribution.byPriority', { defaultValue: 'Tasks by Priority' })}
            </CardTitle>
            <CardDescription>
              {t('analytics.taskDistribution.byPriorityDesc', {
                defaultValue: 'Priority breakdown',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center text-red-500">
              {t('analytics.taskDistribution.error', { defaultValue: 'Error loading task data' })}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>
            {t('analytics.taskDistribution.byStatus', { defaultValue: 'Tasks by Status' })}
          </CardTitle>
          <CardDescription>
            {t('analytics.taskDistribution.byStatusDesc', {
              defaultValue: 'Current distribution of tasks',
            })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={statusConfig} className="min-h-[200px] w-full">
            <BarChart data={translatedData?.byStatus}>
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>
            {t('analytics.taskDistribution.byPriority', { defaultValue: 'Tasks by Priority' })}
          </CardTitle>
          <CardDescription>
            {t('analytics.taskDistribution.byPriorityDesc', { defaultValue: 'Priority breakdown' })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={priorityConfig} className="min-h-[200px] w-full">
            <BarChart data={translatedData?.byPriority}>
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
