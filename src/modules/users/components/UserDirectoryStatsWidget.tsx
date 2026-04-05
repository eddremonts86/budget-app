import { IconUser } from '@tabler/icons-react'
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
import { useUsers } from '@/modules/users'

export function UserDirectoryStatsWidget() {
  const { t } = useTranslation()
  const { data: users = [], isLoading, isFetching, refetch } = useUsers(200)

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-2/3 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-28 w-full" />
        </CardContent>
      </Card>
    )
  }

  // Count by department
  const byDept = users.reduce(
    (acc, u) => {
      const dept = u.departmentName ?? t('users.noDepartment', 'No Department')
      acc[dept] = (acc[dept] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const topDepts = Object.entries(byDept)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-2 @md:flex-row @md:items-center @md:justify-between space-y-0 pb-3">
        <div className="min-w-0">
          <CardTitle>{t('dashboard.widgets.userStats', 'User Directory')}</CardTitle>
          <CardDescription>
            {t('dashboard.widgets.userStatsDesc', 'Team headcount and top departments.')}
          </CardDescription>
          {isFetching ? (
            <div className="mt-1">
              <WidgetRefreshingIndicator />
            </div>
          ) : null}
        </div>
        <WidgetRefreshButton
          isRefreshing={isFetching}
          onRefresh={() => {
            void refetch()
          }}
          label={t('dashboard.actions.refreshUserStats', 'Refresh user stats')}
        />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 shrink-0">
              <IconUser className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-3xl font-bold">{users.length}</div>
              <div className="text-xs text-muted-foreground">
                {t('dashboard.widgets.totalUsers', 'Total users')}
              </div>
            </div>
          </div>
          {topDepts.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {t('dashboard.widgets.topDepartments', 'Top Departments')}
              </p>
              {topDepts.map(([dept, count]) => (
                <div key={dept} className="flex items-center justify-between gap-2">
                  <span className="text-sm truncate">{dept}</span>
                  <span className="text-sm font-medium tabular-nums">{count}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
