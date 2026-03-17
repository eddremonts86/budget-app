import { Bar, BarChart, XAxis, YAxis } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import type { ChartConfig } from '@/components/ui/chart'

interface DistributionDatum {
  name: string
  value: number
}

interface TaskDistributionContentProps {
  byStatus: DistributionDatum[]
  byPriority: DistributionDatum[]
  statusConfig: ChartConfig
  priorityConfig: ChartConfig
  statusTitle: string
  statusDescription: string
  priorityTitle: string
  priorityDescription: string
}

export function TaskDistributionContent({
  byStatus,
  byPriority,
  statusConfig,
  priorityConfig,
  statusTitle,
  statusDescription,
  priorityTitle,
  priorityDescription,
}: TaskDistributionContentProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{statusTitle}</CardTitle>
          <CardDescription>{statusDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={statusConfig} className="min-h-[200px] w-full">
            <BarChart data={byStatus}>
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
          <CardTitle>{priorityTitle}</CardTitle>
          <CardDescription>{priorityDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={priorityConfig} className="min-h-[200px] w-full">
            <BarChart data={byPriority}>
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
