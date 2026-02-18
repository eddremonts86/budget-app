import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import type { ChartConfig } from '@/components/ui/chart'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart'
import { useUsersWorkload } from '../api/dashboard.queries'

export function WorkloadChart() {
  const { t } = useTranslation()
  const { data: workload, isLoading } = useUsersWorkload()

  if (isLoading) {
    // Basic Skeleton loading
    return (
      <Card className="col-span-7">
        <CardHeader>
          <div className="h-6 w-1/3 bg-muted rounded animate-pulse" />
          <div className="h-4 w-1/4 bg-muted rounded animate-pulse mt-2" />
        </CardHeader>
        <CardContent>
          <div className="h-[350px] bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  // Ensure workload is an array before mapping
  const workloadList = Array.isArray(workload) ? workload : []

  // Transform data for Recharts
  const chartData = workloadList.map((item) => ({
    name: item.user.name,
    completed: item.completed,
    pending: item.pending,
    inProgress: item.inProgress,
  }))

  const chartConfig = {
    completed: {
      label: t('status.completed', 'Completed'),
      color: '#10b981', // Emerald-500
    },
    inProgress: {
      label: t('status.inProgress', 'In Progress'),
      color: '#f59e0b', // Amber-500
    },
    pending: {
      label: t('status.pending', 'Pending'),
      color: '#ef4444', // Red-500
    },
  } satisfies ChartConfig

  return (
    <Card className="col-span-7">
      <CardHeader>
        <CardTitle>{t('dashboard.workload.title', 'Team Workload')}</CardTitle>
        <CardDescription>
          {t('dashboard.workload.description', 'Task distribution across team members.')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-[180px] w-full">
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 20, // Add some margin for labels
            }}
            barSize={24}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              width={100} // Increase width for names
              tickFormatter={(value) => value} // Show full name or truncate if needed
            />
            <XAxis dataKey="completed" type="number" hide />
            <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar
              dataKey="completed"
              stackId="a"
              fill="var(--color-completed)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="inProgress"
              stackId="a"
              fill="var(--color-inProgress)"
              radius={[0, 0, 0, 0]}
            />
            <Bar
              dataKey="pending"
              stackId="a"
              fill="var(--color-pending)"
              radius={[0, 4, 4, 0]} // Rounded right side
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
