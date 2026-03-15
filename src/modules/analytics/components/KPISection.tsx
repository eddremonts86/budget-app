import {
  IconCurrencyDollar,
  IconFolder,
  IconChecklist,
  IconUsers,
  IconCreditCard,
  IconActivity,
} from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'
import { kpisQueryOptions } from '../api/analytics.queries'

export function KPISection() {
  const { t } = useTranslation()
  const { data, isLoading, error } = useQuery(kpisQueryOptions)

  if (isLoading) {
    return <KPISkeleton />
  }

  if (error) {
    return (
      <div className="text-red-500">
        {t('analytics.error', { defaultValue: 'Error loading KPIs' })}
      </div>
    )
  }

  const kpis = [
    {
      title: t('analytics.netBalance', { defaultValue: 'Net Balance' }),
      value: `$${data?.netBalance.toLocaleString() ?? '0'}`,
      icon: IconActivity,
      description: t('analytics.netBalanceDesc', { defaultValue: 'Income minus expenses' }),
      color: (data?.netBalance ?? 0) >= 0 ? 'text-emerald-500' : 'text-red-500',
    },
    {
      title: t('analytics.totalRevenue', { defaultValue: 'Total Revenue' }),
      value: `$${data?.revenue.toLocaleString() ?? '0'}`,
      icon: IconCurrencyDollar,
      description: t('analytics.totalRevenueDesc', { defaultValue: 'Total approved income' }),
      color: 'text-emerald-500',
    },
    {
      title: t('analytics.totalExpenses', { defaultValue: 'Total Expenses' }),
      value: `$${data?.expenses.toLocaleString() ?? '0'}`,
      icon: IconCreditCard,
      description: t('analytics.totalExpensesDesc', { defaultValue: 'Total approved expenses' }),
      color: 'text-red-500',
    },
    {
      title: t('analytics.activeProjects', { defaultValue: 'Active Projects' }),
      value: data?.activeProjects.toString() ?? '0',
      icon: IconFolder,
      description: t('analytics.activeProjectsDesc', { defaultValue: 'Currently active projects' }),
    },
    {
      title: t('analytics.taskCompletion', { defaultValue: 'Task Completion' }),
      value: `${data?.taskCompletionRate ?? 0}%`,
      icon: IconChecklist,
      description: `${data?.completedTasks} / ${data?.totalTasks} ${t('analytics.tasks', { defaultValue: 'tasks' })}`,
    },
    {
      title: t('analytics.activeUsers', { defaultValue: 'Active Users' }),
      value: data?.activeUsers.toString() ?? '0',
      icon: IconUsers,
      description: t('analytics.activeUsersDesc', { defaultValue: 'Total registered users' }),
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {kpis.map((kpi) => (
        <Card key={kpi.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
            <kpi.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn('text-2xl font-bold', kpi.color)}>{kpi.value}</div>
            <p className="text-xs text-muted-foreground">{kpi.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function KPISkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {(['kpi-1', 'kpi-2', 'kpi-3', 'kpi-4', 'kpi-5', 'kpi-6'] as const).map((id) => (
        <Card key={id}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-[100px]" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-[60px] mb-2" />
            <Skeleton className="h-3 w-[120px]" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
