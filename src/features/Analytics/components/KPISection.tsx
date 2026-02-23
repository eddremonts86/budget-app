import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { IconCurrencyDollar, IconFolder, IconChecklist, IconUsers } from '@tabler/icons-react'
import { kpisQueryOptions } from '../api/analytics.queries'
import { Skeleton } from '@/components/ui/skeleton'

export function KPISection() {
  const { data, isLoading, error } = useQuery(kpisQueryOptions)

  if (isLoading) {
    return <KPISkeleton />
  }

  if (error) {
    return <div className="text-red-500">Error loading KPIs</div>
  }

  const kpis = [
    {
      title: 'Total Revenue',
      value: `$${data?.revenue.toLocaleString() ?? '0'}`,
      icon: IconCurrencyDollar,
      description: 'Total approved transactions'
    },
    {
      title: 'Active Projects',
      value: data?.activeProjects.toString() ?? '0',
      icon: IconFolder,
      description: 'Currently active projects'
    },
    {
      title: 'Task Completion',
      value: `${data?.taskCompletionRate ?? 0}%`,
      icon: IconChecklist,
      description: `${data?.completedTasks} / ${data?.totalTasks} tasks`
    },
    {
      title: 'Active Users',
      value: data?.activeUsers.toString() ?? '0',
      icon: IconUsers,
      description: 'Total registered users'
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {kpis.map((kpi) => (
        <Card key={kpi.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {kpi.title}
            </CardTitle>
            <kpi.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpi.value}</div>
            <p className="text-xs text-muted-foreground">
              {kpi.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function KPISkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i}>
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
