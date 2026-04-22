import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

interface ExpenseDistributionChartDatum {
  category: string
  amount: number
  percentage: string
  color: string
}

interface ExpenseDistributionChartContentProps {
  chartData: ExpenseDistributionChartDatum[]
  chartConfig: ChartConfig
  height: number
}

function truncateLabel(value: string, maxLen = 22): string {
  return value.length > maxLen ? `${value.slice(0, maxLen - 1)  }…` : value
}

export function ExpenseDistributionChartContent({
  chartData,
  chartConfig,
  height,
}: ExpenseDistributionChartContentProps) {
  return (
    <ChartContainer config={chartConfig} className="w-full" style={{ height: `${height}px` }}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ left: 4, right: 16, top: 4, bottom: 4 }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" hide />
        <YAxis
          dataKey="category"
          type="category"
          tickLine={false}
          axisLine={false}
          width={154}
          tick={{ fontSize: 12 }}
          tickFormatter={(v: string) => truncateLabel(v)}
        />
        <ChartTooltip
          cursor={{ fill: 'transparent' }}
          content={
            <ChartTooltipContent
              labelFormatter={(value) => value}
              formatter={(value, name, item) => [
                <div key={name} className="flex flex-col">
                  <span className="font-bold">${Number(value).toLocaleString()}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.payload.percentage}% of total
                  </span>
                </div>,
                null,
              ]}
            />
          }
        />
        <Bar dataKey="amount" radius={[0, 4, 4, 0]} barSize={20}>
          {chartData.map((entry) => (
            <Cell key={`cell-${entry.category}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
