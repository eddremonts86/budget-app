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
import { WidgetRefreshButton, WidgetRefreshingIndicator } from '@/modules/core/widget'
import { useProjects } from '@/modules/projects'

const STATUS_COLORS: Record<string, string> = {
  active: '#22c55e',
  completed: '#3b82f6',
  on_hold: '#f59e0b',
  planning: '#a855f7',
  cancelled: '#ef4444',
}

const LazyProjectsStatusContent = React.lazy(() =>
  import('./ProjectsStatusWidgetContent').then((m) => ({
    default: m.ProjectsStatusContent,
  })),
)

export function ProjectsStatusWidget() {
  const { t } = useTranslation()
  const { data: projects = [], isLoading, isFetching, refetch } = useProjects()

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-52 w-full" />
        </CardContent>
      </Card>
    )
  }

  const statusCounts = projects.reduce(
    (acc, project) => {
      const s = project.status ?? 'planning'
      acc[s] = (acc[s] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const chartData = Object.entries(statusCounts).map(([status, count]) => ({
    status,
    count,
    color: STATUS_COLORS[status] ?? '#94a3b8',
    label: t(`projects.status.${status}`, status),
  }))

  const total = projects.length

  if (total === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('dashboard.widgets.projectsStatus', 'Project Status')}</CardTitle>
          <CardDescription>
            {t('dashboard.widgets.projectsStatusDesc', 'Overview of projects by current status.')}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          {t('common.noData', 'No data available')}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-3 @md:flex-row @md:items-center @md:justify-between">
        <div className="min-w-0">
          <CardTitle>{t('dashboard.widgets.projectsStatus', 'Project Status')}</CardTitle>
          <CardDescription>
            {t('dashboard.widgets.projectsStatusDesc', 'Overview of projects by current status.')}
          </CardDescription>
          {isFetching ? (
            <div className="mt-1">
              <WidgetRefreshingIndicator />
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <div className="text-2xl font-bold">{total}</div>
            <div className="text-xs text-muted-foreground">
              {t('dashboard.widgets.totalProjects', 'Total Projects')}
            </div>
          </div>
          <WidgetRefreshButton
            isRefreshing={isFetching}
            onRefresh={() => {
              void refetch()
            }}
            label={t('dashboard.actions.refreshProjectsStatus', 'Refresh project status')}
          />
        </div>
      </CardHeader>
      <CardContent>
        <React.Suspense fallback={<Skeleton className="h-52 w-full" />}>
          <LazyProjectsStatusContent chartData={chartData} total={total} />
        </React.Suspense>
      </CardContent>
    </Card>
  )
}
