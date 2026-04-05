import { Link } from '@tanstack/react-router'
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

export function PendingApprovalsWidget() {
  const { t } = useTranslation()
  const { data: transactions = [], isLoading, isFetching, refetch } = useTransactions()

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-2/3 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    )
  }

  const pending = transactions.filter((tx) => tx.status === 'Pending')
  const approved = transactions.filter((tx) => tx.status === 'Approved')
  const rejected = transactions.filter((tx) => tx.status === 'Rejected')

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-2 @md:flex-row @md:items-center @md:justify-between space-y-0 pb-3">
        <div className="min-w-0">
          <CardTitle>{t('dashboard.widgets.pendingApprovals', 'Pending Approvals')}</CardTitle>
          <CardDescription>
            {t('dashboard.widgets.pendingApprovalsDesc', 'Transactions awaiting review.')}
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
          label={t('dashboard.actions.refreshPendingApprovals', 'Refresh pending approvals')}
        />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl font-bold text-amber-500">{pending.length}</div>
              <div className="text-sm text-muted-foreground mt-1">
                {t('dashboard.widgets.awaitingReview', 'awaiting review')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 justify-center flex-wrap">
            <Badge variant="outline" className="gap-1.5 text-green-600 border-green-200">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              {approved.length} {t('transactions.status.approved', 'Approved')}
            </Badge>
            <Badge variant="outline" className="gap-1.5 text-red-600 border-red-200">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              {rejected.length} {t('transactions.status.rejected', 'Rejected')}
            </Badge>
          </div>
          {pending.length > 0 ? (
            <Link
              to="/dashboard/transactions"
              className="inline-flex items-center justify-center rounded-md border border-border bg-muted px-3 py-1.5 text-sm font-medium hover:bg-muted/80 transition-colors text-center"
            >
              {t('dashboard.widgets.reviewTransactions', 'Review transactions →')}
            </Link>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
