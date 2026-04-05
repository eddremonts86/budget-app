import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

interface WorkloadChartDatum {
  name: string
  completed: number
  pending: number
  inProgress: number
}

interface WorkloadChartContentProps {
  chartData: WorkloadChartDatum[]
  chartConfig: ChartConfig
}

export function WorkloadChartContent({ chartData, chartConfig }: WorkloadChartContentProps) {
  return (
    <ChartContainer config={chartConfig} className="h-62.5 w-full">
      <BarChart
        accessibilityLayer
        data={chartData}
        margin={{
          top: 20,
        }}
        barSize={24}
      >
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="name"
          tickLine={false}
          tickMargin={10}
          axisLine={false}
          tickFormatter={(value) => value}
        />
        <YAxis type="number" hide />
        <ChartTooltip cursor={false} content={<ChartTooltipContent indicator="dashed" />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="completed" stackId="a" fill="var(--color-completed)" radius={[0, 0, 0, 0]} />
        <Bar
          dataKey="inProgress"
          stackId="a"
          fill="var(--color-inProgress)"
          radius={[0, 0, 0, 0]}
        />
        <Bar dataKey="pending" stackId="a" fill="var(--color-pending)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
