import { useQuery } from '@tanstack/react-query'
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { revenueTrendQueryOptions } from '../api/analytics.queries'

const chartConfig = {
  revenue: {
    label: 'Revenue',
    color: '#2563eb',
  },
}

interface RevenueChartProps {
  days: number
}

export function RevenueChart({ days }: RevenueChartProps) {
  const { data, isLoading, error } = useQuery(revenueTrendQueryOptions(days))

  if (error) {
    return (
      <Card className="col-span-4 lg:col-span-2">
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Total revenue over the last {days} days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-red-500">
            Error loading revenue data
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-4 lg:col-span-2">
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
        <CardDescription>Total revenue over the last {days} days</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
            <AreaChart
              accessibilityLayer
              data={data}
              margin={{
                left: 12,
                right: 12,
              }}
            >
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(value) => {
                  const date = new Date(value)
                  return date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })
                }}
              />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <Area
                dataKey="amount"
                type="natural"
                fill="url(#fillRevenue)"
                fillOpacity={0.4}
                stroke="var(--color-revenue)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
