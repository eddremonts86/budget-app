import { Cell, Pie, PieChart } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'

interface StatusDatum {
  status: string
  count: number
  color: string
  label: string
}

interface ProjectsStatusContentProps {
  chartData: StatusDatum[]
  total: number
}

export function ProjectsStatusContent({ chartData, total }: ProjectsStatusContentProps) {
  const chartConfig = Object.fromEntries(
    chartData.map((d) => [d.status, { label: d.label, color: d.color }]),
  )

  return (
    <div className="flex flex-col gap-4 @md:flex-row @md:items-center">
      <ChartContainer config={chartConfig} className="mx-auto h-44 w-44 shrink-0">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(_label, payload) =>
                  payload?.[0]?.payload ? (payload[0].payload as StatusDatum).label : ''
                }
                formatter={(value) => [`${String(value)} projects`, null]}
              />
            }
          />
          <Pie
            data={chartData}
            dataKey="count"
            nameKey="status"
            cx="50%"
            cy="50%"
            innerRadius={44}
            outerRadius={72}
            strokeWidth={2}
          >
            {chartData.map((entry) => (
              <Cell key={entry.status} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      <div className="flex flex-col gap-2 min-w-0 flex-1">
        {chartData
          .sort((a, b) => b.count - a.count)
          .map((item) => (
            <div key={item.status} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm text-muted-foreground truncate">{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-sm font-medium">{item.count}</span>
                <span className="text-xs text-muted-foreground">
                  ({((item.count / total) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
