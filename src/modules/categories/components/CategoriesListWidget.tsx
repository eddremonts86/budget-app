import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@/components/ui'
import { useCategories } from '@/modules/categories'
import { WidgetRefreshButton, WidgetRefreshingIndicator } from '@/modules/core/widget'

export function CategoriesListWidget() {
  const { t } = useTranslation()
  const { data: categories = [], isLoading, isFetching, refetch } = useCategories()

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-2 @md:flex-row @md:items-center @md:justify-between space-y-0 pb-3">
        <div className="min-w-0">
          <CardTitle>{t('dashboard.widgets.categoriesList', 'Categories')}</CardTitle>
          <CardDescription>
            {t('dashboard.widgets.categoriesListDesc', 'All available categories at a glance.')}
          </CardDescription>
          {isFetching ? (
            <div className="mt-1">
              <WidgetRefreshingIndicator />
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <div className="text-2xl font-bold">{categories.length}</div>
            <div className="text-xs text-muted-foreground">
              {t('dashboard.widgets.totalCategories', 'total')}
            </div>
          </div>
          <WidgetRefreshButton
            isRefreshing={isFetching}
            onRefresh={() => {
              void refetch()
            }}
            label={t('dashboard.actions.refreshCategories', 'Refresh categories')}
          />
        </div>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
            {t('common.noData', 'No data available')}
          </div>
        ) : (
          <div className="flex flex-col gap-0 max-h-56 overflow-y-auto">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-2.5 py-2 border-b last:border-0 border-border/60"
              >
                <span
                  className="h-3 w-3 rounded-sm shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-sm truncate">{cat.name}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
