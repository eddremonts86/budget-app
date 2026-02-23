import { useQuery } from '@tanstack/react-query'
import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { taskDistributionQueryOptions } from '../api/analytics.queries'

const statusConfig = {
  count: {
    label: 'Tasks',
    color: '#3b82f6', // Azul vibrante
  },
}

const priorityConfig = {
  count: {
    label: 'Tasks',
    color: '#ef4444', // Rojo vibrante
  },
}

export function TaskDistribution() {
  const { data, isLoading, error } = useQuery(taskDistributionQueryOptions)

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-[300px]" />
        <Skeleton className="h-[300px]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Status</CardTitle>
            <CardDescription>Current distribution of tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center text-red-500">
              Error loading task data
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tasks by Priority</CardTitle>
            <CardDescription>Priority breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] items-center justify-center text-red-500">
              Error loading task data
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Tasks by Status</CardTitle>
          <CardDescription>Current distribution of tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={statusConfig} className="min-h-[200px] w-full">
            <BarChart data={data?.byStatus}>
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Tasks by Priority</CardTitle>
          <CardDescription>Priority breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={priorityConfig} className="min-h-[200px] w-full">
            <BarChart data={data?.byPriority}>
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="var(--color-count)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
