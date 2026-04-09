import { IconTrendingUp, IconTrendingDown, IconScale, IconTarget } from '@tabler/icons-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/shared/lib/utils'
import { formatAmount } from '../model/period-utils'
import type { BudgetHealthSummary } from '../model/types'

interface BudgetSummaryCardsProps {
  health: BudgetHealthSummary
  currency: string
}

export function BudgetSummaryCards({ health, currency }: BudgetSummaryCardsProps) {
  const { t } = useTranslation()

  const remaining = health.remaining ?? 0
  const isOver = health.status === 'over_budget'
  const usagePct = Math.min(100, Math.round(health.usagePct ?? 0))

  return (
    <div className="rounded-xl border bg-card overflow-hidden">
      {/* Metric row */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
        {/* Income */}
        <div className="p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <IconTrendingUp className="size-3.5 text-emerald-500" />
            {t('budgets.summary.income')}
          </div>
          <p className="text-lg font-bold text-emerald-600 tabular-nums">
            {formatAmount(health.income, currency)}
          </p>
        </div>

        {/* Expenses */}
        <div className="p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <IconTrendingDown className="size-3.5 text-red-500" />
            {t('budgets.summary.expenses')}
          </div>
          <p className="text-lg font-bold text-red-500 tabular-nums">
            {formatAmount(health.spent, currency)}
          </p>
        </div>

        {/* Balance */}
        <div className="p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <IconScale className="size-3.5" />
            {t('budgets.summary.balance')}
          </div>
          <p
            className={cn(
              'text-lg font-bold tabular-nums',
              health.balance >= 0 ? 'text-emerald-600' : 'text-red-500',
            )}
          >
            {formatAmount(health.balance, currency)}
          </p>
        </div>

        {/* Remaining / Over */}
        <div className="p-4 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <IconTarget className={cn('size-3.5', isOver ? 'text-red-500' : 'text-blue-500')} />
            {isOver ? t('budgets.summary.overBy') : t('budgets.summary.remaining')}
          </div>
          <p
            className={cn(
              'text-lg font-bold tabular-nums',
              isOver ? 'text-red-500' : 'text-blue-600',
            )}
          >
            {health.target !== null
              ? formatAmount(isOver ? health.overBy : remaining, currency)
              : t('budgets.summary.noLimit')}
          </p>
          {health.usagePct !== null && (
            <p className="text-xs text-muted-foreground">
              {usagePct}% {t('budgets.summary.used')}
            </p>
          )}
        </div>
      </div>

      {/* Progress bar spanning full width */}
      {health.target !== null && (
        <div className="h-1 bg-muted">
          <div
            className={cn(
              'h-full transition-all duration-500',
              isOver ? 'bg-red-500' : usagePct > 80 ? 'bg-amber-500' : 'bg-emerald-500',
            )}
            style={{ width: `${Math.min(100, usagePct)}%` }}
          />
        </div>
      )}
    </div>
  )
}
