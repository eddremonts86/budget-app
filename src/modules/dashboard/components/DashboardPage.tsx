import {
  IconActivity,
  IconCurrencyDollar,
  IconFolder,
  IconTrendingUp,
  IconTrendingDown,
  IconCreditCard,
} from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import { cn } from '@/shared/lib/utils'
import { useDashboardMetric } from '../api/dashboard.queries'
import { ExpenseDistributionChart } from './ExpenseDistributionChart'
import { UpcomingTodosList } from './UpcomingTodosList'
import { WidgetRefreshButton, WidgetRefreshingIndicator } from './WidgetControls'
import { WorkloadChart } from './WorkloadChart'

function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-25" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </CardHeader>
      <CardContent>
        <Skeleton className="mb-2 h-8 w-30" />
        <Skeleton className="h-3 w-37.5" />
      </CardContent>
    </Card>
  )
}

function NetBalanceCard() {
  const { t } = useTranslation()
  const { data, isLoading, isError, isFetching, refetch } = useDashboardMetric('netBalance')

  if (isLoading) return <StatsCardSkeleton />
  if (isError || !data) return <StatsCardSkeleton />

  return (
    <Link to="/dashboard/analytics" className="block transition-transform hover:scale-[1.02]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.stats.netBalance', { defaultValue: 'Net Balance' })}
            </CardTitle>
            {isFetching ? <WidgetRefreshingIndicator /> : null}
          </div>
          <div className="flex items-center gap-1">
            <WidgetRefreshButton
              isRefreshing={isFetching}
              onRefresh={() => {
                void refetch()
              }}
              label={t('dashboard.actions.refreshNetBalance', {
                defaultValue: 'Refresh net balance',
              })}
            />
            <IconActivity className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div
            className={cn(
              'text-2xl font-bold',
              data.value >= 0 ? 'text-emerald-500' : 'text-red-500',
            )}
          >
            ${data.value.toLocaleString()}
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p className="flex items-center gap-1">
              {data.change >= 0 ? (
                <IconTrendingUp className="h-3 w-3 text-emerald-500" />
              ) : (
                <IconTrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={data.change >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                {data.change > 0 ? '+' : ''}
                {data.change}%
              </span>
              <span>vs last month</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function RevenueCard() {
  const { t } = useTranslation()
  const { data, isLoading, isError, isFetching, refetch } = useDashboardMetric('revenue')

  if (isLoading) return <StatsCardSkeleton />
  if (isError || !data) return <StatsCardSkeleton />

  return (
    <Link to="/dashboard/analytics" className="block transition-transform hover:scale-[1.02]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.stats.totalRevenue')}
            </CardTitle>
            {isFetching ? <WidgetRefreshingIndicator /> : null}
          </div>
          <div className="flex items-center gap-1">
            <WidgetRefreshButton
              isRefreshing={isFetching}
              onRefresh={() => {
                void refetch()
              }}
              label={t('dashboard.actions.refreshRevenue', { defaultValue: 'Refresh revenue' })}
            />
            <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${data.value.toLocaleString()}</div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>
              {t('dashboard.stats.change', {
                value: `${data.change > 0 ? '+' : ''}${data.change}%`,
              })}
            </p>
            <p>
              {t('dashboard.stats.pendingApproval', { defaultValue: 'Pending approval' })}:$
              {data.pendingApprovalTotal.toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function ExpensesCard() {
  const { t } = useTranslation()
  const { data, isLoading, isError, isFetching, refetch } = useDashboardMetric('expenses')

  if (isLoading) return <StatsCardSkeleton />
  if (isError || !data) return <StatsCardSkeleton />

  return (
    <Link to="/dashboard/analytics" className="block transition-transform hover:scale-[1.02]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.stats.totalExpenses', { defaultValue: 'Total Expenses' })}
            </CardTitle>
            {isFetching ? <WidgetRefreshingIndicator /> : null}
          </div>
          <div className="flex items-center gap-1">
            <WidgetRefreshButton
              isRefreshing={isFetching}
              onRefresh={() => {
                void refetch()
              }}
              label={t('dashboard.actions.refreshExpenses', { defaultValue: 'Refresh expenses' })}
            />
            <IconCreditCard className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-500">
            {data.value > 0 ? '-' : ''}${data.value.toLocaleString()}
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <p>
              {t('dashboard.stats.change', {
                value: `${data.change > 0 ? '+' : ''}${data.change}%`,
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

function ActiveProjectsCard() {
  const { t } = useTranslation()
  const { data, isLoading, isError, isFetching, refetch } = useDashboardMetric('activeProjects')

  if (isLoading) return <StatsCardSkeleton />
  if (isError || !data) return <StatsCardSkeleton />

  return (
    <Link to="/dashboard/projects" className="block transition-transform hover:scale-[1.02]">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">
              {t('dashboard.stats.activeProjects', { defaultValue: 'Active Projects' })}
            </CardTitle>
            {isFetching ? <WidgetRefreshingIndicator /> : null}
          </div>
          <div className="flex items-center gap-1">
            <WidgetRefreshButton
              isRefreshing={isFetching}
              onRefresh={() => {
                void refetch()
              }}
              label={t('dashboard.actions.refreshActiveProjects', {
                defaultValue: 'Refresh active projects',
              })}
            />
            <IconFolder className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{data.value.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">{data.context}</p>
        </CardContent>
      </Card>
    </Link>
  )
}

export function DashboardPage() {
  return (
    <div className="flex flex-col h-full gap-8 overflow-y-auto">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 shrink-0">
        <NetBalanceCard />
        <RevenueCard />
        <ExpensesCard />
        <ActiveProjectsCard />
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
