import { useTranslation } from 'react-i18next'
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useBudgetSpendingByCategory } from '../api/budget-analytics.queries'
import { useBudgetCategoryLimits } from '../api/budget-limits.queries'
import { formatAmount } from '../model/period-utils'

interface BudgetMiniChartsProps {
  budgetId: string
  currency: string
}

const FALLBACK_COLORS = [
  '#6366f1',
  '#f59e0b',
  '#10b981',
  '#3b82f6',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#84cc16',
]

function getColor(color: string | null | undefined, index: number): string {
  return color && color !== '#6b7280' ? color : FALLBACK_COLORS[index % FALLBACK_COLORS.length]
}

interface TooltipPayloadEntry {
  payload?: {
    categoryName?: string
    spent?: number
    budget?: number
    actual?: number
    currency?: string
  }
  name?: string
  value?: number
}

function DonutTooltip({
  active,
  payload,
  currency,
}: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  currency: string
}) {
  if (!active || !payload?.length) return null
  const d = payload[0]
  return (
    <div className="rounded-lg border bg-background px-2 py-1.5 shadow-md text-xs">
      <p className="font-medium">{d.payload?.categoryName}</p>
      <p className="text-muted-foreground">{formatAmount(d.payload?.spent ?? 0, currency)}</p>
    </div>
  )
}

export function BudgetMiniCharts({ budgetId, currency }: BudgetMiniChartsProps) {
  const { t } = useTranslation()
  const { data: spending = [] } = useBudgetSpendingByCategory(budgetId)
  const { data: limits = [] } = useBudgetCategoryLimits(budgetId)

  // Only show charts when there's actual spending data
  const hasSpending = spending.some((s) => s.spent > 0)
  if (!hasSpending) return null

  // Donut data — expense categories only
  const donutData = spending
    .filter((s) => s.spent > 0)
    .map((s, i) => ({
      categoryId: s.categoryId,
      categoryName: s.categoryName,
      spent: s.spent,
      fill: getColor(s.categoryColor, i),
    }))

  // Spend rows — all categories with spending, plus those with a set limit but no spend
  const limitsMap = new Map(limits.map((l) => [l.categoryId, l.allocatedAmount]))
  const spendRows = spending
    .filter((s) => s.spent > 0 || limitsMap.has(s.categoryId ?? ''))
    .map((s, i) => ({
      categoryName: s.categoryName,
      budget: limitsMap.get(s.categoryId ?? '') ?? 0,
      actual: s.spent,
      fill: getColor(s.categoryColor, i),
    }))
    .slice(0, 4) // max 4 rows to keep card compact

  // Labels for donut — only show if > 5%
  const totalSpent = donutData.reduce((acc, d) => acc + d.spent, 0)

  return (
    <div
      className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-3"
      onClick={(e) => e.preventDefault()} // prevent card navigation on chart click
    >
      {/* Donut */}
      <div>
        <p className="text-xs font-semibold text-foreground mb-2 text-center">
          {t('budgets.charts.real', 'Resumen real')}
        </p>
        <ResponsiveContainer width="100%" height={120}>
          <PieChart>
            <Pie
              data={donutData}
              cx="50%"
              cy="50%"
              innerRadius="48%"
              outerRadius="78%"
              paddingAngle={2}
              dataKey="spent"
              stroke="none"
            >
              {donutData.map((entry, i) => (
                <Cell key={`cell-${i}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={<DonutTooltip currency={currency} />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Legend */}
        <div className="flex flex-col gap-1 mt-1.5 px-1">
          {donutData.slice(0, 3).map((d, i) => {
            const pct = Math.round((d.spent / totalSpent) * 100)
            return (
              <div key={i} className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="inline-block h-2 w-2 rounded-full shrink-0"
                    style={{ background: d.fill }}
                  />
                  <span className="text-[11px] text-foreground/80 truncate leading-none">
                    {d.categoryName}
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-foreground shrink-0">{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Spend vs budget — horizontal progress bars */}
      <div>
        <p className="text-xs font-semibold text-foreground mb-3 text-center">
          {t('budgets.charts.vsReal', 'Gasto por categoría')}
        </p>
        <div className="flex flex-col gap-2.5 px-0.5">
          {spendRows.map((row, i) => {
            const hasLimit = row.budget > 0
            const pct = hasLimit ? Math.min(100, Math.round((row.actual / row.budget) * 100)) : 100
            const isOver = hasLimit && row.actual > row.budget
            const limitLabel = hasLimit ? formatAmount(row.budget, currency) : '∞'
            return (
              <div key={i} className="space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="inline-block h-2 w-2 rounded-full shrink-0"
                      style={{ background: row.fill }}
                    />
                    <span className="text-[11px] text-foreground/80 truncate leading-none">
                      {row.categoryName}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-semibold shrink-0 tabular-nums ${
                      isOver ? 'text-red-500' : 'text-foreground'
                    }`}
                  >
                    {formatAmount(row.actual, currency)}{' '}
                    <span className="font-normal text-muted-foreground">/ {limitLabel}</span>
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isOver ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: !isOver && pct <= 80 ? row.fill : undefined,
                    }}
                  />
                </div>
              </div>
            )
          })}
          {spendRows.length === 0 && (
            <p className="text-[11px] text-muted-foreground text-center py-2">
              Sin límites definidos
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
