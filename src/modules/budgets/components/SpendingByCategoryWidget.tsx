import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { WidgetRefreshButton, WidgetRefreshingIndicator } from '@/modules/core/widget'
import { useTransactions } from '@/modules/transactions/api/transactions.queries'
import type { Transaction } from '@/modules/transactions/model/types'
import { formatAmount } from '../model/period-utils'

interface CategorySpend {
  categoryId: string | null
  label: string
  spent: number
  color: string
}

export function SpendingByCategoryWidget() {
  const { t } = useTranslation()
  const { data: transactionData, isLoading, isFetching, refetch } = useTransactions()
  const transactions = (transactionData ?? []) as Transaction[]

  const topCategories = React.useMemo<CategorySpend[]>(() => {
    const now = new Date()
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))

    const map = new Map<string, CategorySpend>()

    transactions
      .filter((tx: Transaction) => {
        if (!tx.date || tx.amount >= 0) return false
        const d = new Date(tx.date)
        return d >= monthStart
      })
      .forEach((tx: Transaction) => {
        const key = tx.categoryId ?? '__none__'
        const existing = map.get(key)
        if (existing) {
          existing.spent += Math.abs(tx.amount)
        } else {
          map.set(key, {
            categoryId: tx.categoryId ?? null,
            label: tx.categoryId ?? t('budgets.categories.uncategorized'),
            spent: Math.abs(tx.amount),
            color: '#6b7280',
          })
        }
      })

    return [...map.values()].sort((a, b) => b.spent - a.spent).slice(0, 6)
  }, [transactions, t])

  const maxSpent = topCategories[0]?.spent ?? 1

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col gap-3 @md:flex-row @md:items-start @md:justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>{t('dashboard.widgets.spendingByCategory', 'Spending by Category')}</CardTitle>
          <CardDescription>
            {t('dashboard.widgets.spendingByCategoryDesc', 'Top expense categories this month.')}
          </CardDescription>
          {isFetching && (
            <div className="mt-1">
              <WidgetRefreshingIndicator />
            </div>
          )}
        </div>
        <WidgetRefreshButton
          isRefreshing={isFetching}
          onRefresh={() => void refetch()}
          label={t('budgets.widgets.refreshCategories', 'Refresh categories')}
        />
      </CardHeader>
      <CardContent>
        {topCategories.length === 0 ? (
          <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">
            {t('common.noData', 'No data available')}
          </div>
        ) : (
          <div className="space-y-3">
            {topCategories.map((cat, idx) => (
              <div key={cat.categoryId ?? idx} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium truncate">{cat.label}</span>
                  <span className="text-muted-foreground ml-2 tabular-nums">
                    {formatAmount(cat.spent, 'USD')}
                  </span>
                </div>
                <Progress value={(cat.spent / maxSpent) * 100} className="h-1.5" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
