import { format } from 'date-fns'
import {
  Plus,
  Trash2,
  Pause,
  Play,
  Pencil,
  TrendingDown,
  TrendingUp,
  CalendarClock,
} from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/shared/lib/toast'
import { cn } from '@/shared/lib/utils'
import {
  useBudgetRecurrenceRules,
  useUpdateRecurrenceRule,
  useDeleteRecurrenceRule,
} from '../api/budget-recurrences.queries'
import { formatAmount } from '../model/period-utils'
import type { BudgetRecurrenceRule } from '../model/types'
import { CreateRecurrenceSheet } from './CreateRecurrenceSheet'
import { EditRecurrenceSheet } from './EditRecurrenceSheet'

interface BudgetRecurrencesPanelProps {
  budgetId: string
  currency: string
}

export function BudgetRecurrencesPanel({ budgetId, currency }: BudgetRecurrencesPanelProps) {
  const { t } = useTranslation()
  const { data: rules, isLoading } = useBudgetRecurrenceRules(budgetId)
  const updateMutation = useUpdateRecurrenceRule(budgetId)
  const deleteMutation = useDeleteRecurrenceRule(budgetId)

  const [createOpen, setCreateOpen] = React.useState(false)
  const [editRule, setEditRule] = React.useState<BudgetRecurrenceRule | null>(null)

  function toggleStatus(rule: BudgetRecurrenceRule) {
    updateMutation.mutate({
      id: rule.id,
      status: rule.status === 'active' ? 'paused' : 'active',
      pausedReason: rule.status === 'active' ? t('budgets.recurrences.manualPause') : null,
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {rules?.length ?? 0} {t('budgets.recurrences.count')}
        </p>
        <Button size="sm" variant="outline" onClick={() => setCreateOpen(true)}>
          <Plus className="size-4 mr-1" />
          {t('budgets.recurrences.add')}
        </Button>
      </div>

      {!rules?.length ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <CalendarClock className="size-8 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">
            {t('budgets.recurrences.empty')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => {
            const isExpense = rule.amount <= 0
            const isPaused = rule.status === 'paused'

            return (
              <div
                key={rule.id}
                className={cn(
                  'relative flex items-center gap-4 rounded-xl border bg-card px-4 py-3.5 overflow-hidden transition-opacity',
                  isPaused && 'opacity-60',
                )}
              >
                {/* Left accent bar */}
                <div
                  className={cn(
                    'absolute left-0 top-0 bottom-0 w-1 rounded-l-xl',
                    isExpense ? 'bg-red-500' : 'bg-emerald-500',
                  )}
                />

                {/* Type icon */}
                <div
                  className={cn(
                    'shrink-0 flex items-center justify-center size-9 rounded-lg',
                    isExpense
                      ? 'bg-red-500/10 text-red-500'
                      : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
                  )}
                >
                  {isExpense ? (
                    <TrendingDown className="size-4" />
                  ) : (
                    <TrendingUp className="size-4" />
                  )}
                </div>

                {/* Main content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold truncate">
                      {rule.description ?? t('budgets.recurrences.noDescription')}
                    </span>
                    {rule.categoryName && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border"
                        style={
                          rule.categoryColor
                            ? {
                                borderColor: `${rule.categoryColor}40`,
                                backgroundColor: `${rule.categoryColor}15`,
                                color: rule.categoryColor,
                              }
                            : undefined
                        }
                      >
                        {rule.categoryName}
                      </span>
                    )}
                    {isPaused && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                        {t('budgets.recurrences.status.paused')}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className={cn(
                        'text-sm font-bold tabular-nums',
                        isExpense
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-emerald-700 dark:text-emerald-400',
                      )}
                    >
                      {formatAmount(Math.abs(rule.amount), currency)}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {t(`budgets.recurrences.frequency.${rule.frequency}`)}
                      {rule.interval > 1 && ` ×${rule.interval}`}
                    </span>
                    <span className="text-xs text-muted-foreground">·</span>
                    <span className="text-xs text-muted-foreground">
                      {t('budgets.recurrences.nextOn')}{' '}
                      {format(new Date(rule.nextDate), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="shrink-0 flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 rounded-lg"
                    onClick={() => setEditRule(rule)}
                    title={t('budgets.recurrences.edit', 'Edit')}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className={cn(
                      'size-8 rounded-lg',
                      isPaused && 'text-emerald-600 dark:text-emerald-400',
                    )}
                    onClick={() => toggleStatus(rule)}
                    disabled={updateMutation.isPending}
                    title={
                      isPaused ? t('budgets.recurrences.resume') : t('budgets.recurrences.pause')
                    }
                  >
                    {isPaused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 rounded-lg text-destructive hover:text-destructive"
                    onClick={() =>
                      toast.error(t('budgets.recurrences.deleteConfirm'), {
                        description: t('common.undoWarning'),
                        action: {
                          label: t('common.delete'),
                          onClick: () => deleteMutation.mutate(rule.id),
                        },
                        duration: 10000,
                      })
                    }
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <CreateRecurrenceSheet
        budgetId={budgetId}
        currency={currency}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      {editRule && (
        <EditRecurrenceSheet
          rule={editRule}
          currency={currency}
          open={!!editRule}
          onOpenChange={(open) => {
            if (!open) setEditRule(null)
          }}
        />
      )}
    </div>
  )
}
