import type { ColumnDef } from '@tanstack/react-table'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  VirtualTable,
  TableSearchBar,
  TableEmptyState,
  TableErrorState,
  TableSkeleton,
  flattenInfinitePages,
  useDebouncedSearch,
  DEFAULT_PAGE_SIZE,
} from '@/shared/ui/tables'
import type { ProjectPerformanceRow } from '../api/analytics.fn'
import { useInfiniteProjectPerformance } from '../api/analytics.queries'

export function ProjectPerformance() {
  const { t } = useTranslation()
  const { searchInput, setSearchInput, activeSearch, clearSearch } = useDebouncedSearch()

  const query = useInfiniteProjectPerformance(DEFAULT_PAGE_SIZE, activeSearch)
  const totalCount = query.data?.pages[0]?.totalCount ?? 0
  const projects = React.useMemo(
    () => flattenInfinitePages<ProjectPerformanceRow>(query.data?.pages),
    [query.data?.pages],
  )

  const columns: ColumnDef<ProjectPerformanceRow, unknown>[] = React.useMemo(
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

  if (query.isLoading) {
    return <TableSkeleton />
  }

  if (query.isError) {
    return <TableErrorState />
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
        <div className="space-y-4">
          <TableSearchBar
            searchInput={searchInput}
            onSearchChange={setSearchInput}
            onClear={clearSearch}
            loadedCount={projects.length}
            totalCount={totalCount}
            showSpinner={query.isFetchingNextPage}
          />
          {projects.length === 0 && !query.isFetching ? (
            <TableEmptyState isSearchActive={!!activeSearch} onClearSearch={clearSearch} />
          ) : (
            <div className="h-[400px] flex flex-col">
              <VirtualTable
                columns={columns}
                data={projects}
                hasNextPage={query.hasNextPage}
                isFetchingNextPage={query.isFetchingNextPage}
                onFetchNextPage={() => query.fetchNextPage()}
                scrollResetKey={activeSearch}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
