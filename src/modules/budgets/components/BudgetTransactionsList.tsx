import { format, isToday, isYesterday } from 'date-fns'
import { Plus, ArrowUpRight, ArrowDownLeft, Pencil, Trash2, RefreshCw } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useTransactions,
  useDeleteTransaction,
} from '@/modules/transactions/api/transactions.queries'
import type { Transaction } from '@/modules/transactions/model/types'
import { toast } from '@/shared/lib/toast'
import { cn } from '@/shared/lib/utils'
import { formatAmount } from '../model/period-utils'
import { EditTransactionInBudgetSheet } from './EditTransactionInBudgetSheet'

interface BudgetTransactionsListProps {
  budgetId: string
  currency: string
  onAddTransaction?: () => void
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr)
  if (isToday(d)) return 'Today'
  if (isYesterday(d)) return 'Yesterday'
  return format(d, 'MMMM d, yyyy')
}

function groupByDate(txs: Transaction[]): { label: string; items: Transaction[] }[] {
  const map = new Map<string, Transaction[]>()
  for (const tx of txs) {
    const key = tx.date ? String(tx.date).split('T')[0] : 'unknown'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(tx)
  }
  return Array.from(map.entries()).map(([key, items]) => ({
    label: key === 'unknown' ? '—' : formatDateLabel(key),
    items,
  }))
}

export function BudgetTransactionsList({
  budgetId,
  currency,
  onAddTransaction,
}: BudgetTransactionsListProps) {
  const { t } = useTranslation()
  const { data: rawTransactions, isLoading } = useTransactions()
  const allTransactions = rawTransactions as Transaction[] | undefined
  const deleteMutation = useDeleteTransaction()
  const [editingTx, setEditingTx] = React.useState<Transaction | null>(null)

  const filtered = React.useMemo(() => {
    if (!allTransactions) return []
    return allTransactions
      .filter((tx: Transaction) => tx.budgetId === budgetId)
      .sort((a: Transaction, b: Transaction) => {
        const dateA = new Date(a.date ?? 0).getTime()
        const dateB = new Date(b.date ?? 0).getTime()
        return dateB - dateA
      })
  }, [allTransactions, budgetId])

  const groups = React.useMemo(() => groupByDate(filtered), [filtered])

  if (isLoading) {
    return (
      <div className="space-y-3 pt-1">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{filtered.length}</span>{' '}
          {t('budgets.transactions.count')}
        </p>
        {onAddTransaction && (
          <Button size="sm" onClick={onAddTransaction} className="gap-1.5">
            <Plus className="size-3.5" />
            {t('budgets.transactions.add')}
          </Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
          <div className="flex flex-col items-center gap-2">
            <ArrowUpRight className="size-8 opacity-20" />
            <p className="text-sm">{t('budgets.transactions.empty')}</p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border bg-card overflow-hidden divide-y divide-border">
          {groups.map((group) => (
            <div key={group.label}>
              {/* Date header */}
              <div className="px-4 py-2 bg-muted/30 border-b border-border/60">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  {group.label}
                </span>
              </div>

              {/* Rows */}
              {group.items.map((tx: Transaction) => {
                const isIncome = tx.amount > 0
                const isAuto = tx.description?.startsWith('[Auto]')
                const displayDesc = isAuto
                  ? tx.description!.replace('[Auto]', '').trim()
                  : (tx.description ?? t('budgets.transactions.noDescription'))

                return (
                  <div
                    key={tx.id}
                    className="group flex items-center gap-4 px-4 py-3.5 hover:bg-muted/40 transition-colors"
                  >
                    {/* Type icon */}
                    <div
                      className={cn(
                        'flex size-9 shrink-0 items-center justify-center rounded-full',
                        isIncome
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600'
                          : 'bg-red-100 dark:bg-red-950/60 text-red-500',
                      )}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="size-4" />
                      ) : (
                        <ArrowDownLeft className="size-4" />
                      )}
                    </div>

                    {/* Description + meta */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-sm font-medium truncate">{displayDesc}</p>
                        {isAuto && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 shrink-0">
                            <RefreshCw className="size-2.5" />
                            Recurrente
                          </span>
                        )}
                      </div>
                      {tx.status && tx.status !== 'Approved' && (
                        <span
                          className={cn(
                            'text-[10px] font-medium px-1.5 py-0.5 rounded-full mt-0.5 inline-block',
                            tx.status === 'Pending'
                              ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600'
                              : 'bg-red-100 dark:bg-red-950/40 text-red-600',
                          )}
                        >
                          {tx.status}
                        </span>
                      )}
                    </div>

                    {/* Amount */}
                    <span
                      className={cn(
                        'text-sm font-semibold tabular-nums shrink-0',
                        isIncome ? 'text-emerald-600' : 'text-red-500',
                      )}
                    >
                      {isIncome ? '+' : ''}
                      {formatAmount(tx.amount, currency)}
                    </span>

                    {/* Actions — visible on hover */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-muted-foreground hover:text-foreground"
                        onClick={() => setEditingTx(tx)}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => {
                          toast.error(t('budgets.transactions.deleteConfirm'), {
                            description: t('common.undoWarning'),
                            action: {
                              label: t('common.delete'),
                              onClick: () => deleteMutation.mutate(tx.id),
                            },
                            duration: 10000,
                          })
                        }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {editingTx && (
        <EditTransactionInBudgetSheet
          tx={editingTx}
          currency={currency}
          open={!!editingTx}
          onOpenChange={(open) => {
            if (!open) setEditingTx(null)
          }}
        />
      )}
    </div>
  )
}
