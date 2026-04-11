import type { ColumnDef } from '@tanstack/react-table'
import { useQuery } from '@tanstack/react-query'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable } from '@/shared/ui/tables/DataTable'
import { projectPerformanceQueryOptions } from '../api/analytics.queries'

interface ProjectRow {
  id: string
  name: string
  status: string
  budget: number | null
  spent: number
  progress: number
  taskCount: number
  completedTaskCount: number
}

export function ProjectPerformance() {
  const { t } = useTranslation()
  const { data, isLoading } = useQuery(projectPerformanceQueryOptions)

  const columns: ColumnDef<ProjectRow>[] = React.useMemo(
    () => [
      {
        accessorKey: 'name',
        header: t('analytics.projectPerformance.columns.name', { defaultValue: 'Project Name' }),
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: 'status',
        header: t('analytics.projectPerformance.columns.status', { defaultValue: 'Status' }),
        cell: ({ row }) => (
          <Badge variant={row.original.status === 'active' ? 'default' : 'secondary'}>
            {t(`analytics.projectPerformance.status.${row.original.status}`, row.original.status)}
          </Badge>
        ),
      },
      {
        id: 'budget',
        header: t('analytics.projectPerformance.columns.budget', { defaultValue: 'Budget Used' }),
        cell: ({ row }) => (
          <span>
            ${row.original.spent.toLocaleString()} / ${row.original.budget?.toLocaleString() ?? '0'}
          </span>
        ),
      },
      {
        accessorKey: 'progress',
        header: t('analytics.projectPerformance.columns.completion', {
          defaultValue: 'Task Completion',
        }),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Progress value={row.original.progress} className="w-[60%]" />
            <span className="text-xs text-muted-foreground">{row.original.progress}%</span>
          </div>
        ),
      },
      {
        id: 'tasks',
        header: t('analytics.projectPerformance.columns.tasks', { defaultValue: 'Tasks' }),
        cell: ({ row }) => (
          <span className="text-right">
            {row.original.completedTaskCount} / {row.original.taskCount}
          </span>
        ),
      },
    ],
    [t],
  )

  if (isLoading) {
    return <Skeleton className="h-[400px] w-full" />
  }

  return (
    <Card className="col-span-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>
              {t('analytics.projectPerformance.title', { defaultValue: 'Project Performance' })}
            </CardTitle>
            <CardDescription>
              {t('analytics.projectPerformance.description', {
                defaultValue: 'Overview of project progress and budget usage',
              })}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={(data as ProjectRow[]) ?? []} filterColumn="name" />
      </CardContent>
    </Card>
  )
}
