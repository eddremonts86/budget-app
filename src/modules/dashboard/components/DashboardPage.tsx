import {
  IconActivity,
  IconCurrencyDollar,
  IconFolder,
  IconTrendingUp,
  IconTrendingDown,
  IconCreditCard,
  IconPencil,
  IconCheck,
} from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui'
import {
  WidgetConfigurator,
  WidgetGrid,
  WidgetEditModeProvider,
  useWidgetEditMode,
} from '@/modules/core/widget'
import { cn } from '@/shared/lib/utils'
import { useDashboardMetric } from '../api/dashboard.queries'
import { WidgetRefreshButton, WidgetRefreshingIndicator } from '@/modules/core/widget'

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

export function StatsCardsWidget() {
  return (
    <div className="grid gap-4 grid-cols-2 @[53rem]:grid-cols-4">
      <NetBalanceCard />
      <RevenueCard />
      <ExpensesCard />
      <ActiveProjectsCard />
    </div>
  )
}

function DashboardToolbar() {
  const { editing, toggleEditing } = useWidgetEditMode()

  return (
    <div className="flex items-center justify-end gap-2 shrink-0">
      {editing ? <WidgetConfigurator /> : null}
      <button
        type="button"
        onClick={toggleEditing}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
          editing
            ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
            : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        {editing ? <IconCheck className="h-4 w-4" /> : <IconPencil className="h-4 w-4" />}
        {editing ? 'Done' : 'Customize'}
      </button>
    </div>
  )
}

export function DashboardPage() {
  return (
    <WidgetEditModeProvider>
      <div className="flex flex-col h-full gap-8 overflow-y-auto">
        {/* Toolbar: edit mode toggle + configurator */}
        <DashboardToolbar />

        {/* All widgets — drag-and-drop sortable */}
        <WidgetGrid />
      </div>
    </WidgetEditModeProvider>
  )
}
