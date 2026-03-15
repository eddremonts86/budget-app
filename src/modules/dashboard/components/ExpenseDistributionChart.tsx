import { useTranslation } from 'react-i18next'
import { BarChart, Bar, XAxis, YAxis, Cell, CartesianGrid } from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { useExpenseDistribution } from '../api/dashboard.queries'

export function ExpenseDistributionChart() {
  const { t } = useTranslation()
  const { data: distribution, isLoading } = useExpenseDistribution()

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="h-6 w-1/3 bg-muted rounded animate-pulse" />
          <div className="h-4 w-1/4 bg-muted rounded animate-pulse mt-2" />
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  const data = Array.isArray(distribution) ? [...distribution] : []

  // Sort data by amount descending
  data.sort((a, b) => b.amount - a.amount)

  if (data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{t('dashboard.expenseDistribution.title', 'Expense Distribution')}</CardTitle>
          <CardDescription>
            {t(
              'dashboard.expenseDistribution.description',
              'Distribution of project expenses by category.',
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          {t('common.noData', 'No data available')}
        </CardContent>
      </Card>
    )
  }

  const total = data.reduce((acc, item) => acc + item.amount, 0)

  const chartData = data.map((item) => ({
    category: item.category,
    amount: item.amount,
    percentage: ((item.amount / total) * 100).toFixed(1),
    color: item.color || '#3b82f6',
  }))

  const chartConfig = chartData.reduce((acc, item) => {
    acc[item.category] = {
      label: item.category,
      color: item.color,
    }
    return acc
  }, {} as ChartConfig)

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t('dashboard.expenseDistribution.title', 'Expense Distribution')}</CardTitle>
          <CardDescription>
            {t(
              'dashboard.expenseDistribution.description',
              'Distribution of project expenses by category.',
            )}
          </CardDescription>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">${total.toLocaleString()}</div>
          <div className="text-xs text-muted-foreground">
            {t('dashboard.stats.totalExpenses', 'Total Expenses')}
          </div>
        </div>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  )
}
