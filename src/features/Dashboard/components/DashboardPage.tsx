import {
  IconActivity,
  IconCurrencyDollar,
  IconFolder,
  IconTrendingUp,
  IconTrendingDown,
  IconCreditCard,
} from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import { cn } from '@/shared/lib/utils'
import { useDashboardStats } from '../api/dashboard.queries'
import { ExpenseDistributionChart } from './ExpenseDistributionChart'
import { UpcomingTodosList } from './UpcomingTodosList'
import { WorkloadChart } from './WorkloadChart'

export function DashboardPage() {
  const { t } = useTranslation()
  const { data: stats, isLoading: isLoadingStats, isError: isErrorStats } = useDashboardStats()

  if (isErrorStats) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-destructive">
            {t('dashboard.error.title')}
          </h2>
          <p className="text-muted-foreground">{t('dashboard.error.description')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full gap-8 overflow-y-auto">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 shrink-0">
        {isLoadingStats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[120px] mb-2" />
                <Skeleton className="h-3 w-[150px]" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.stats.netBalance', { defaultValue: 'Net Balance' })}
                </CardTitle>
                <IconActivity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div
                  className={cn(
                    'text-2xl font-bold',
                    (stats?.netBalance?.value ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500',
                  )}
                >
                  ${stats?.netBalance?.value?.toLocaleString() ?? '0'}
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="flex items-center gap-1">
                    {(stats?.netBalance?.change ?? 0) >= 0 ? (
                      <IconTrendingUp className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <IconTrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span
                      className={
                        (stats?.netBalance?.change ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500'
                      }
                    >
                      {(stats?.netBalance?.change ?? 0) > 0 ? '+' : ''}
                      {stats?.netBalance?.change ?? 0}%
                    </span>
                    <span>vs last month</span>
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.stats.totalRevenue')}
                </CardTitle>
                <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats?.revenue?.value?.toLocaleString() ?? '0'}
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    {t('dashboard.stats.change', {
                      value: `${(stats?.revenue?.change ?? 0) > 0 ? '+' : ''}${
                        stats?.revenue?.change ?? 0
                      }%`,
                    })}
                  </p>
                  <p>
                    {t('dashboard.stats.pendingApproval', { defaultValue: 'Pending approval' })}: $
                    {stats?.revenue?.pendingApprovalTotal?.toLocaleString() ?? '0'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.stats.totalExpenses', { defaultValue: 'Total Expenses' })}
                </CardTitle>
                <IconCreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-500">
                  -${stats?.expenses?.value?.toLocaleString() ?? '0'}
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>
                    {t('dashboard.stats.change', {
                      value: `${(stats?.expenses?.change ?? 0) > 0 ? '+' : ''}${
                        stats?.expenses?.change ?? 0
                      }%`,
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.stats.activeProjects', { defaultValue: 'Active Projects' })}
                </CardTitle>
                <IconFolder className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats?.activeProjects?.value?.toLocaleString() ?? '0'}
                </div>
                <p className="text-xs text-muted-foreground">{stats?.activeProjects?.context}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 items-start">
        <div className="lg:col-span-4 flex flex-col gap-4">
          <WorkloadChart />
          <ExpenseDistributionChart />
        </div>
        <div className="lg:col-span-3">
          <UpcomingTodosList />
        </div>
      </div>
    </div>
  )
}
