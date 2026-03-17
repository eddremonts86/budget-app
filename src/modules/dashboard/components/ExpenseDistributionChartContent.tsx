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
}

export function ExpenseDistributionChartContent({
  chartData,
  chartConfig,
}: ExpenseDistributionChartContentProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[350px] w-full">
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{
          left: 40,
          right: 20,
        }}
      >
        <CartesianGrid horizontal={false} strokeDasharray="3 3" />
        <XAxis type="number" hide />
        <YAxis
          dataKey="category"
          type="category"
          tickLine={false}
          axisLine={false}
          width={100}
          tick={{ fontSize: 12 }}
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
