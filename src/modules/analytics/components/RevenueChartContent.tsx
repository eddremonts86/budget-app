import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'

interface RevenueTrendDatum {
  date: string
  income: number
  expenses: number
}

interface RevenueChartContentProps {
  data: RevenueTrendDatum[]
  chartConfig: ChartConfig
}

export function RevenueChartContent({ data, chartConfig }: RevenueChartContentProps) {
  return (
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
          <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-income)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--color-income)" stopOpacity={0.1} />
          </linearGradient>
          <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-expenses)" stopOpacity={0.8} />
            <stop offset="95%" stopColor="var(--color-expenses)" stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <Area
          dataKey="income"
          type="natural"
          fill="url(#fillIncome)"
          fillOpacity={0.4}
          stroke="var(--color-income)"
          stackId="a"
        />
        <Area
          dataKey="expenses"
          type="natural"
          fill="url(#fillExpenses)"
          fillOpacity={0.4}
          stroke="var(--color-expenses)"
          stackId="b"
        />
      </AreaChart>
    </ChartContainer>
  )
}
