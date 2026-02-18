import { IconChartBar } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui'

export function AnalyticsPage() {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-3xl font-bold tracking-tight">{t('analytics.title')}</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 flex-1 content-start min-h-0 overflow-y-auto">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('analytics.pageViews')}</CardTitle>
            <IconChartBar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,234</div>
            <p className="text-xs text-muted-foreground">+19% from last month</p>
          </CardContent>
        </Card>
      </div>
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>{t('analytics.overview')}</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
          <div className="h-[200px] flex items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg">
            {t('analytics.placeholder')}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
