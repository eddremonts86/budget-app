import { IconUsers, IconCreditCard, IconActivity, IconCurrencyDollar } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import { useDashboardStats } from '../api/dashboard.queries'
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
    <div className="flex flex-col gap-8">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                  {t('dashboard.stats.totalRevenue')}
                </CardTitle>
                <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats?.revenue?.value?.toLocaleString() ?? '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('dashboard.stats.change', {
                    value: `${(stats?.revenue?.change ?? 0) > 0 ? '+' : ''}${
                      stats?.revenue?.change ?? 0
                    }%`,
                  })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.stats.subscriptions')}
                </CardTitle>
                <IconUsers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(stats?.subscriptions?.value ?? 0) > 0 ? '+' : ''}
                  {stats?.subscriptions?.value?.toLocaleString() ?? '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t('dashboard.stats.change', {
                    value: `${(stats?.subscriptions?.change ?? 0) > 0 ? '+' : ''}${
                      stats?.subscriptions?.change ?? 0
                    }%`,
                  })}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('dashboard.stats.sales')}</CardTitle>
                <IconCreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(stats?.sales?.value ?? 0) > 0 ? '+' : ''}
                  {stats?.sales?.value?.toLocaleString() ?? '0'}
                </div>
                <p className="text-xs text-muted-foreground">{stats?.sales?.context}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {t('dashboard.stats.activeNow')}
                </CardTitle>
                <IconActivity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(stats?.activeNow?.value ?? 0) > 0 ? '+' : ''}
                  {stats?.activeNow?.value?.toLocaleString() ?? '0'}
                </div>
                <p className="text-xs text-muted-foreground">{stats?.activeNow?.context}</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 items-start">
        <WorkloadChart />
        <UpcomingTodosList />
      </div>
    </div>
  )
}
