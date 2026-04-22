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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { WidgetRefreshButton, WidgetRefreshingIndicator } from '@/modules/core/widget'
import { useProjects } from '@/modules/projects'
import { useTeams } from '@/modules/team'
import { useUsersWorkload } from '../api/analytics.queries'

const LazyWorkloadChartContent = React.lazy(() =>
  import('./WorkloadWidgetContent').then((module) => ({
    default: module.WorkloadChartContent,
  })),
)

export function WorkloadChart() {
  const { t } = useTranslation()
  const emptyFilterValue = '__all__'
  const [projectId, setProjectId] = React.useState<string | undefined>()
  const [teamId, setTeamId] = React.useState<string | undefined>()
  const hasInitializedDefaultProject = React.useRef(false)
  const { data: projects = [] } = useProjects()
  const { data: teams = [] } = useTeams()
  type ProjectOption = (typeof projects)[number]
  type TeamOption = (typeof teams)[number]
  const sortedProjects = React.useMemo(
    () =>
      [...projects].sort((left: ProjectOption, right: ProjectOption) =>
        left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }),
      ),
    [projects],
  )
  const sortedTeams = React.useMemo(
    () =>
      [...teams].sort((left: TeamOption, right: TeamOption) =>
        left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }),
      ),
    [teams],
  )

  React.useEffect(() => {
    if (hasInitializedDefaultProject.current || sortedProjects.length === 0) {
      return
    }

    hasInitializedDefaultProject.current = true
    setProjectId(sortedProjects[0]?.id)
  }, [sortedProjects])

  const { data: workload, isLoading, isFetching, refetch } = useUsersWorkload({ projectId, teamId })

  if (isLoading) {
    // Basic Skeleton loading
    return (
      <Card className="col-span-4">
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/4 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-62.5 w-full" />
        </CardContent>
      </Card>
    )
  }

  // Ensure workload is an array before mapping
  const workloadList = Array.isArray(workload) ? workload : []

  // Transform data for Recharts
  const chartData = workloadList.map((item) => ({
    name: item.user.name,
    completed: item.completed,
    pending: item.pending,
    inProgress: item.inProgress,
  }))

  const hasFilters = Boolean(projectId || teamId)

  const chartConfig = {
    completed: {
      label: t('todos.status.completed', 'Completed'),
      color: '#10b981', // Emerald-500
    },
    inProgress: {
      label: t('todos.status.inProgress', 'In Progress'),
      color: '#f59e0b', // Amber-500
    },
    pending: {
      label: t('todos.status.pending', 'Pending'),
      color: '#ef4444', // Red-500
    },
  } satisfies ChartConfig

  return (
    <Card className="col-span-4">
      <CardHeader>
        <div className="flex flex-col gap-4 @xl:flex-row @xl:items-start @xl:justify-between">
          <div className="min-w-0">
            <CardTitle>{t('dashboard.workload.title', 'Team Workload')}</CardTitle>
            <CardDescription>
              {t('dashboard.workload.description', 'Task distribution across team members.')}
            </CardDescription>
            {isFetching ? (
              <div className="mt-1">
                <WidgetRefreshingIndicator />
              </div>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <div className="grid gap-2 @sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <Select
                value={projectId ?? emptyFilterValue}
                onValueChange={(value) => {
                  React.startTransition(() => {
                    setProjectId(value === emptyFilterValue ? undefined : value)
                  })
                }}
              >
                <SelectTrigger className="h-9 rounded-xl">
                  <SelectValue
                    placeholder={t('dashboard.workload.filters.project', {
                      defaultValue: 'All projects',
                    })}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={emptyFilterValue}>
                    {t('dashboard.workload.filters.project', {
                      defaultValue: 'All projects',
                    })}
                  </SelectItem>
                  {sortedProjects.map((project: ProjectOption) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={teamId ?? emptyFilterValue}
                onValueChange={(value) => {
                  React.startTransition(() => {
                    setTeamId(value === emptyFilterValue ? undefined : value)
                  })
                }}
              >
                <SelectTrigger className="h-9 rounded-xl">
                  <SelectValue
                    placeholder={t('dashboard.workload.filters.team', {
                      defaultValue: 'All teams',
                    })}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={emptyFilterValue}>
                    {t('dashboard.workload.filters.team', {
                      defaultValue: 'All teams',
                    })}
                  </SelectItem>
                  {sortedTeams.map((team: TeamOption) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <WidgetRefreshButton
                isRefreshing={isFetching}
                onRefresh={() => {
                  void refetch()
                }}
                label={t('dashboard.actions.refreshWorkload', {
                  defaultValue: 'Refresh team workload',
                })}
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {workloadList.length === 0 ? (
          <div className="flex h-62.5 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            {hasFilters
              ? t('dashboard.workload.emptyFiltered', {
                  defaultValue: 'No workload data for the selected project or team.',
                })
              : t('dashboard.workload.empty', {
                  defaultValue: 'No workload data available.',
                })}
          </div>
        ) : (
          <React.Suspense
            fallback={<div className="h-62.5 w-full rounded-lg bg-muted/50 animate-pulse" />}
          >
            <LazyWorkloadChartContent chartData={chartData} chartConfig={chartConfig} />
          </React.Suspense>
        )}
      </CardContent>
    </Card>
  )
}
