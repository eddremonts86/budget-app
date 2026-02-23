import { IconDownload, IconSearch } from '@tabler/icons-react'
import { useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { revenueTrendQueryOptions, taskCompletionTrendQueryOptions } from '../api/analytics.queries'
import { KPISection } from './KPISection'
import { ProjectPerformance } from './ProjectPerformance'
import { RevenueChart } from './RevenueChart'
import { TaskCompletionChart } from './TaskCompletionChart'
import { TaskDistribution } from './TaskDistribution'

export function AnalyticsPage() {
  const { t } = useTranslation()
  const [days, setDays] = useState(30)
  const queryClient = useQueryClient()

  const handleExport = async () => {
    try {
      // Fetch data for export
      const revenueData = await queryClient.fetchQuery(revenueTrendQueryOptions(days))
      const taskData = await queryClient.fetchQuery(taskCompletionTrendQueryOptions(days))

      // Create CSV content
      const csvContent = [
        ['Date', 'Revenue', 'Tasks Completed'],
        ...revenueData.map((r) => {
          const task = taskData.find((t) => t.date === r.date)
          return [r.date, r.amount, task?.count || 0]
        }),
      ]
        .map((e) => e.join(','))
        .join('\n')

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `analytics_report_${days}days.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Failed to export data', error)
    }
  }

  return (
    <div className="flex flex-col h-full space-y-4 p-4 md:p-8 pt-6">
      <div className="flex flex-col md:flex-row items-center justify-between space-y-2 md:space-y-0">
        <h2 className="text-3xl font-bold tracking-tight">{t('analytics.title')}</h2>
        <div className="flex items-center space-x-2">
          <InputGroup className="w-[200px]">
            <InputGroupAddon>
              <IconSearch />
            </InputGroupAddon>
            <InputGroupInput placeholder="Search..." />
          </InputGroup>
          <Select value={days.toString()} onValueChange={(val) => setDays(Number(val))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Select days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExport}>
            <IconDownload className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto">
        <KPISection />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <RevenueChart days={days} />
          <TaskCompletionChart days={days} />
        </div>

        <TaskDistribution />

        <ProjectPerformance />
      </div>
    </div>
  )
}
