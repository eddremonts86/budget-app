import { format } from 'date-fns'
import { Plus, Trash2, Pause, Play } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useBudgetRecurrenceRules,
  useUpdateRecurrenceRule,
  useDeleteRecurrenceRule,
} from '../api/budget-recurrences.queries'
import { formatAmount } from '../model/period-utils'
import type { BudgetRecurrenceRule } from '../model/types'
import { CreateRecurrenceSheet } from './CreateRecurrenceSheet'

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
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          {t('budgets.recurrences.empty')}
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-start gap-3 rounded-lg border bg-card px-4 py-3"
            >
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">
                    {rule.description ?? t('budgets.recurrences.noDescription')}
                  </span>
                  <Badge
                    variant={rule.status === 'active' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {t(`budgets.recurrences.status.${rule.status}`)}
                  </Badge>
                  {rule.categoryName && (
                    <Badge variant="outline" className="text-xs">
                      {rule.categoryName}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatAmount(rule.amount, currency)} ·{' '}
                  {t(`budgets.recurrences.frequency.${rule.frequency}`)}
                  {rule.interval > 1 && ` ×${rule.interval}`} · {t('budgets.recurrences.nextOn')}{' '}
                  {format(new Date(rule.nextDate), 'MMM d, yyyy')}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7"
                  onClick={() => toggleStatus(rule)}
                  disabled={updateMutation.isPending}
                  title={
                    rule.status === 'active'
                      ? t('budgets.recurrences.pause')
                      : t('budgets.recurrences.resume')
                  }
                >
                  {rule.status === 'active' ? (
                    <Pause className="size-3" />
                  ) : (
                    <Play className="size-3" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 text-destructive"
                  onClick={() => deleteMutation.mutate(rule.id)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="size-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateRecurrenceSheet
        budgetId={budgetId}
        currency={currency}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  )
}
