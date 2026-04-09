import { format } from 'date-fns'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@/components/ui'
import { Badge } from '@/components/ui/badge'
import { WidgetRefreshButton, WidgetRefreshingIndicator } from '@/modules/core/widget'
import { useTransactions } from '@/modules/transactions'
import { cn } from '@/shared/utils'

const STATUS_STYLES: Record<'Approved' | 'Pending' | 'Rejected', string> = {
  Approved: 'text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30',
  Pending: 'text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/30',
  Rejected: 'text-red-600 border-red-200 bg-red-50 dark:bg-red-950/30',
}

export function RecentTransactionsWidget() {
  const { t } = useTranslation()
  const { data: transactions = [], isLoading, isFetching, refetch } = useTransactions()

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  const recent = [...transactions]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8)

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-3 @md:flex-row @md:items-start @md:justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>{t('dashboard.widgets.recentTransactions', 'Recent Transactions')}</CardTitle>
          <CardDescription>
            {t('dashboard.widgets.recentTransactionsDesc', 'Latest financial activity.')}
          </CardDescription>
          {isFetching ? (
            <div className="mt-1">
              <WidgetRefreshingIndicator />
            </div>
          ) : null}
        </div>
        <WidgetRefreshButton
          isRefreshing={isFetching}
          onRefresh={() => {
            void refetch()
          }}
          label={t('dashboard.actions.refreshRecentTransactions', 'Refresh transactions')}
        />
      </CardHeader>
      <CardContent>
        {recent.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            {t('common.noData', 'No data available')}
          </div>
        ) : (
          <div className="flex flex-col gap-0">
            {recent.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-3 py-2.5 border-b last:border-0 border-border/60"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{tx.customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(tx.date), 'MMM d, yyyy')}
                    {tx.paymentMethod ? ` · ${tx.paymentMethod}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-xs shrink-0',
                      STATUS_STYLES[tx.status] ?? STATUS_STYLES.Pending,
                    )}
                  >
                    {t(`transactions.status.${tx.status.toLowerCase()}`, tx.status)}
                  </Badge>
                  <span
                    className={cn(
                      'text-sm font-semibold tabular-nums',
                      tx.status === 'Rejected' ? 'text-muted-foreground line-through' : '',
                    )}
                  >
                    ${tx.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
