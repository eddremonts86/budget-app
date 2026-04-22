import { pdf } from '@react-pdf/renderer'
import { format } from 'date-fns'
import { AlertTriangle, Loader2, Pause, Download } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/shared/lib/utils'
import { useBudgetAnnualReport } from '../api/budget-analytics.queries'
import { useBudgetRecurrenceRules } from '../api/budget-recurrences.queries'
import type { BudgetRecurrenceFrequency } from '../model/types'
import { BudgetAnnualReportPdf } from './BudgetAnnualReportPdf'

interface BudgetAnnualReportProps {
  budgetId: string
  budgetName: string
  currency: string
}

// ---------------------------------------------------------------------------
// Helper — compute which months of `year` a recurring rule fires in,
// based on startDate + frequency + interval.
// ---------------------------------------------------------------------------
function getFireMonthsInYear(
  startDateStr: string,
  frequency: BudgetRecurrenceFrequency,
  interval: number,
  year: number,
): string[] {
  // Daily / weekly: treat as firing every calendar month
  if (frequency === 'daily' || frequency === 'weekly') {
    return Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`)
  }

  const start = new Date(startDateStr)
  const startAbsMonth = start.getFullYear() * 12 + start.getMonth() // 0-indexed

  let monthsPerPeriod: number
  switch (frequency) {
    case 'monthly':
      monthsPerPeriod = interval
      break
    case 'quarterly':
      monthsPerPeriod = 3 * interval
      break
    case 'semiannual':
      monthsPerPeriod = 6 * interval
      break
    case 'annual':
      monthsPerPeriod = 12 * interval
      break
    default:
      monthsPerPeriod = 1
  }

  const yearAbsStart = year * 12
  // First k whose fire-date lands in or after January of `year`
  const kMin = Math.max(0, Math.ceil((yearAbsStart - startAbsMonth) / monthsPerPeriod))

  const fireMonths: string[] = []
  for (let k = kMin; ; k++) {
    const absMonth = startAbsMonth + k * monthsPerPeriod
    const y = Math.floor(absMonth / 12)
    const m = absMonth % 12 // 0-indexed
    if (y > year) break
    if (y === year) {
      fireMonths.push(`${year}-${String(m + 1).padStart(2, '0')}`)
    }
  }
  return fireMonths
}

// ---------------------------------------------------------------------------
// Currency display — code small + muted, number prominent
// ---------------------------------------------------------------------------
function FormattedCurrency({ amount, currency }: { amount: number; currency: string }) {
  const parts = new Intl.NumberFormat('en-US', { style: 'currency', currency }).formatToParts(
    amount / 100,
  )
  let code = ''
  const numParts: string[] = []
  let afterCode = false
  for (const p of parts) {
    if (p.type === 'currency') {
      code = p.value
      afterCode = true
    } else if (p.type === 'literal' && afterCode && numParts.length === 0) {
      // swallow the space immediately after the currency code
    } else {
      numParts.push(p.value)
    }
  }
  return (
    <>
      <span className="text-[9px] font-normal tracking-tight text-muted-foreground/40 mr-0.5 select-none">
        {code}
      </span>
      {numParts.join('')}
    </>
  )
}

// ---------------------------------------------------------------------------
// Shared amount cell
// ---------------------------------------------------------------------------
function AmountCell({
  value,
  currency,
  className,
}: {
  value: number
  currency: string
  className?: string
}) {
  if (value === 0) {
    return (
      <td className={cn('px-3 py-2 text-left text-xs text-muted-foreground/25', className)}>—</td>
    )
  }
  return (
    <td className={cn('px-3 py-2 text-left text-xs tabular-nums', className)}>
      <FormattedCurrency amount={value} currency={currency} />
    </td>
  )
}

// ---------------------------------------------------------------------------
// Section label row (colspan full width)
// ---------------------------------------------------------------------------
function SectionRow({
  label,
  colSpan,
  className,
}: {
  label: string
  colSpan: number
  className?: string
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className={cn('px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest', className)}
      >
        {label}
      </td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export function BudgetAnnualReport({ budgetId, budgetName, currency }: BudgetAnnualReportProps) {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()
  const [year, setYear] = React.useState(currentYear)

  const { data: reportData, isLoading: reportLoading } = useBudgetAnnualReport(budgetId, year)
  const { data: rules, isLoading: rulesLoading } = useBudgetRecurrenceRules(budgetId)

  const isLoading = reportLoading || rulesLoading

  const [isExporting, setIsExporting] = React.useState(false)

  const years = [currentYear, currentYear - 1, currentYear - 2]

  const currentMonthStr = format(new Date(), 'yyyy-MM')

  // Always have 12 months even while loading
  const months = React.useMemo(
    () =>
      reportData?.months ??
      Array.from({ length: 12 }, (_, i) => `${year}-${String(i + 1).padStart(2, '0')}`),
    [reportData?.months, year],
  )

  // Split rules into income / expense (completed rules hidden)
  const incomeRules = (rules ?? []).filter((r) => r.amount > 0 && r.status !== 'completed')
  const expenseRules = (rules ?? []).filter((r) => r.amount <= 0 && r.status !== 'completed')

  // Compute fire-months for each rule
  const fireMonthsById = React.useMemo(() => {
    const map: Record<string, Set<string>> = {}
    for (const rule of rules ?? []) {
      map[rule.id] = new Set(
        getFireMonthsInYear(rule.startDate, rule.frequency, rule.interval, year),
      )
    }
    return map
  }, [rules, year])

  // Projected totals per month — active rules only (paused excluded)
  const projectedIncomePerMonth = React.useMemo(() => {
    const out: Record<string, number> = {}
    for (const rule of incomeRules.filter((r) => r.status === 'active')) {
      for (const m of Array.from(fireMonthsById[rule.id] ?? [])) {
        out[m] = (out[m] ?? 0) + rule.amount
      }
    }
    return out
  }, [incomeRules, fireMonthsById])

  const projectedExpensesPerMonth = React.useMemo(() => {
    const out: Record<string, number> = {}
    for (const rule of expenseRules.filter((r) => r.status === 'active')) {
      for (const m of Array.from(fireMonthsById[rule.id] ?? [])) {
        out[m] = (out[m] ?? 0) + Math.abs(rule.amount)
      }
    }
    return out
  }, [expenseRules, fireMonthsById])

  const projectedTotalIncome = Object.values(projectedIncomePerMonth).reduce((a, b) => a + b, 0)
  const projectedTotalExpenses = Object.values(projectedExpensesPerMonth).reduce((a, b) => a + b, 0)

  // Accumulated expenses (from real transactions)
  const accumExpenses = React.useMemo(() => {
    const out: Record<string, number> = {}
    let running = 0
    for (const m of months) {
      running += reportData?.summary.expenses[m] ?? 0
      out[m] = running
    }
    return out
  }, [months, reportData?.summary.expenses])

  const totalCols = months.length + 2 // label + 12 months + total

  const hasRules = (rules?.length ?? 0) > 0
  const hasAnyData =
    hasRules ||
    (reportData?.summary.totalExpenses ?? 0) > 0 ||
    (reportData?.summary.totalIncome ?? 0) > 0

  async function handleExportPdf() {
    setIsExporting(true)
    try {
      const doc = (
        <BudgetAnnualReportPdf
          budgetName={budgetName}
          year={year}
          currency={currency}
          months={months}
          incomeRules={incomeRules.map((r) => ({
            id: r.id,
            description: r.description ?? null,
            frequency: r.frequency,
            interval: r.interval,
            amount: r.amount,
            status: r.status,
            categoryName: r.categoryName ?? null,
          }))}
          expenseRules={expenseRules.map((r) => ({
            id: r.id,
            description: r.description ?? null,
            frequency: r.frequency,
            interval: r.interval,
            amount: r.amount,
            status: r.status,
            categoryName: r.categoryName ?? null,
          }))}
          fireMonthsById={Object.fromEntries(
            Object.entries(fireMonthsById).map(([id, set]) => [id, Array.from(set)]),
          )}
          projectedIncomePerMonth={projectedIncomePerMonth}
          projectedExpensesPerMonth={projectedExpensesPerMonth}
          projectedTotalIncome={projectedTotalIncome}
          projectedTotalExpenses={projectedTotalExpenses}
          directTransactions={reportData?.directTransactions ?? []}
          summary={{
            income: reportData?.summary.income ?? {},
            expenses: reportData?.summary.expenses ?? {},
            balance: reportData?.summary.balance ?? {},
            totalIncome: reportData?.summary.totalIncome ?? 0,
            totalExpenses: reportData?.summary.totalExpenses ?? 0,
            totalBalance: reportData?.summary.totalBalance ?? 0,
          }}
        />
      )
      const blob = await pdf(doc).toBlob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${budgetName.replace(/\s+/g, '-')}-${year}-report.pdf`
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 10_000)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div id="budget-annual-report" className="space-y-4">
      {/* Header + year selector */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm font-semibold">{t('budgets.report.title', 'Annual Report')}</p>
          <p className="text-xs text-muted-foreground">
            {t(
              'budgets.report.subtitle',
              'Recurring rules projected · actual totals below each section',
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <div className="flex rounded-lg border overflow-hidden">
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setYear(y)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium transition-colors',
                  year === y
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                {y}
              </button>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleExportPdf}
            disabled={isLoading || !hasAnyData || isExporting}
            className="gap-1.5"
          >
            {isExporting ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Download className="size-3.5" />
            )}
            {isExporting
              ? t('budgets.report.exporting', 'Generating...')
              : t('budgets.report.exportPdf', 'Export PDF')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 rounded-lg" />
          ))}
        </div>
      ) : !hasAnyData ? (
        <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground text-sm">
          {t('budgets.report.noData', 'No data for {{year}}', { year })}
        </div>
      ) : (
        <div className="space-y-4">
          {/* ─── TABLE 1: Recurring rules ─── */}
          <div className="rounded-xl border overflow-clip">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                {/* ── Column headers ── */}
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="sticky left-0 z-20 bg-card px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground min-w-48 border-r border-border/60">
                      {t('budgets.report.item', 'Item')}
                    </th>
                    {months.map((m) => {
                      const [y, mo] = m.split('-').map(Number)
                      const d = new Date(y, mo - 1, 1)
                      return (
                        <th
                          key={m}
                          className={cn(
                            'px-3 py-2.5 text-left text-xs font-medium min-w-24',
                            m > currentMonthStr
                              ? 'text-muted-foreground/40'
                              : 'text-muted-foreground',
                          )}
                        >
                          {format(d, 'MMM')}
                        </th>
                      )
                    })}
                    <th className="px-3 py-2.5 text-left text-xs font-bold min-w-26 border-l border-border/60">
                      {t('budgets.report.total', 'Total')}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {/* ══════════════════════════════════════════════ INGRESOS */}
                  <SectionRow
                    label={t('budgets.report.incomeTable', 'Income')}
                    colSpan={totalCols}
                    className="bg-emerald-500/5 text-emerald-700/70 dark:text-emerald-400/60 border-b border-border/30"
                  />

                  {incomeRules.length === 0 ? (
                    <tr className="border-b border-border/30">
                      <td
                        colSpan={totalCols}
                        className="px-4 py-2 text-xs text-muted-foreground/40 italic"
                      >
                        {t('budgets.report.noRules', 'No recurring income rules')}
                      </td>
                    </tr>
                  ) : (
                    incomeRules.map((rule, idx) => {
                      const isPaused = rule.status === 'paused'
                      const fires = fireMonthsById[rule.id] ?? new Set()
                      const ruleTotal = Array.from(fires).reduce((s) => s + rule.amount, 0)
                      return (
                        <tr
                          key={rule.id}
                          className={cn(
                            'border-b border-border/30 transition-colors hover:bg-muted/10',
                            idx % 2 === 1 && 'bg-muted/3',
                            isPaused && 'opacity-40',
                          )}
                        >
                          <td className="sticky left-0 z-10 bg-background px-4 py-2.5 border-r border-border/60">
                            <div className="flex items-center gap-2 min-w-0">
                              {isPaused && (
                                <Pause className="size-3 text-muted-foreground shrink-0" />
                              )}
                              <span className="text-xs font-medium truncate">
                                {rule.description ?? t('budgets.recurrences.noDescription')}
                              </span>
                              {rule.categoryName && (
                                <span
                                  className="text-[10px] px-1.5 py-0.5 rounded-full border shrink-0"
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
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5 ml-0">
                              {t(`budgets.recurrences.frequency.${rule.frequency}`)}
                              {rule.interval > 1 && ` ×${rule.interval}`}
                            </p>
                          </td>
                          {months.map((m) => (
                            <AmountCell
                              key={m}
                              value={fires.has(m) ? rule.amount : 0}
                              currency={currency}
                              className={cn(
                                'text-emerald-700 dark:text-emerald-400',
                                m > currentMonthStr && 'opacity-50',
                              )}
                            />
                          ))}
                          <td className="px-3 py-2.5 text-left text-xs font-semibold tabular-nums border-l border-border/60 text-emerald-700 dark:text-emerald-400">
                            {ruleTotal > 0 ? (
                              <FormattedCurrency amount={ruleTotal} currency={currency} />
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}

                  {/* Direct (non-recurring) income transactions — unplanned, high visibility */}
                  {(reportData?.directTransactions ?? [])
                    .filter((d) => d.totalIncome > 0)
                    .map((d) => (
                      <tr
                        key={`direct-inc-${d.description}`}
                        className="border-b border-amber-300/30 dark:border-amber-700/20 bg-amber-500/6 transition-colors hover:bg-amber-500/15"
                      >
                        <td className="sticky left-0 z-10 bg-amber-50 dark:bg-amber-950 px-4 py-2 border-r border-amber-300/40 dark:border-amber-700/30">
                          <div className="flex items-center gap-2 min-w-0">
                            <AlertTriangle className="size-3 text-amber-500 shrink-0" />
                            <span className="text-xs font-semibold truncate text-amber-900 dark:text-amber-100">
                              {d.description}
                            </span>
                            {d.categoryName && (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded-full border shrink-0"
                                style={
                                  d.categoryColor
                                    ? {
                                        borderColor: `${d.categoryColor}40`,
                                        backgroundColor: `${d.categoryColor}15`,
                                        color: d.categoryColor,
                                      }
                                    : undefined
                                }
                              >
                                {d.categoryName}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 font-semibold uppercase tracking-wide">
                            {t('budgets.report.directLabel', 'unplanned')}
                          </p>
                        </td>
                        {months.map((m) => (
                          <AmountCell
                            key={m}
                            value={d.income[m] ?? 0}
                            currency={currency}
                            className="text-emerald-700 dark:text-emerald-400 font-semibold"
                          />
                        ))}
                        <td className="px-3 py-2 text-left text-xs font-bold tabular-nums border-l border-amber-300/40 dark:border-amber-700/30 text-emerald-700 dark:text-emerald-400">
                          <FormattedCurrency amount={d.totalIncome} currency={currency} />
                        </td>
                      </tr>
                    ))}

                  {/* ══════════════════════════════════════════════ GASTOS */}
                  <SectionRow
                    label={t('budgets.report.expensesTable', 'Expenses')}
                    colSpan={totalCols}
                    className="bg-red-500/5 text-red-600/70 dark:text-red-400/60 border-b border-border/30"
                  />

                  {expenseRules.length === 0 ? (
                    <tr className="border-b border-border/30">
                      <td
                        colSpan={totalCols}
                        className="px-4 py-2 text-xs text-muted-foreground/40 italic"
                      >
                        {t('budgets.report.noExpenseRules', 'No recurring expense rules')}
                      </td>
                    </tr>
                  ) : (
                    expenseRules.map((rule, idx) => {
                      const isPaused = rule.status === 'paused'
                      const fires = fireMonthsById[rule.id] ?? new Set()
                      const absAmount = Math.abs(rule.amount)
                      const ruleTotal = Array.from(fires).reduce((s) => s + absAmount, 0)
                      return (
                        <tr
                          key={rule.id}
                          className={cn(
                            'border-b border-border/30 transition-colors hover:bg-muted/10',
                            idx % 2 === 1 && 'bg-muted/3',
                            isPaused && 'opacity-40',
                          )}
                        >
                          <td className="sticky left-0 z-10 bg-background px-4 py-2.5 border-r border-border/60">
                            <div className="flex items-center gap-2 min-w-0">
                              {isPaused && (
                                <Pause className="size-3 text-muted-foreground shrink-0" />
                              )}
                              <span className="text-xs font-medium truncate">
                                {rule.description ?? t('budgets.recurrences.noDescription')}
                              </span>
                              {rule.categoryName && (
                                <span
                                  className="text-[10px] px-1.5 py-0.5 rounded-full border shrink-0"
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
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {t(`budgets.recurrences.frequency.${rule.frequency}`)}
                              {rule.interval > 1 && ` ×${rule.interval}`}
                            </p>
                          </td>
                          {months.map((m) => (
                            <AmountCell
                              key={m}
                              value={fires.has(m) ? absAmount : 0}
                              currency={currency}
                              className={cn(
                                'text-red-600 dark:text-red-400',
                                m > currentMonthStr && 'opacity-50',
                              )}
                            />
                          ))}
                          <td className="px-3 py-2.5 text-left text-xs font-semibold tabular-nums border-l border-border/60 text-red-600 dark:text-red-400">
                            {ruleTotal > 0 ? (
                              <FormattedCurrency amount={ruleTotal} currency={currency} />
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      )
                    })
                  )}

                  {/* Direct (non-recurring) expense transactions — unplanned, high visibility */}
                  {(reportData?.directTransactions ?? [])
                    .filter((d) => d.totalExpenses > 0)
                    .map((d) => (
                      <tr
                        key={`direct-exp-${d.description}`}
                        className="border-b border-amber-300/30 dark:border-amber-700/20 bg-amber-500/6 transition-colors hover:bg-amber-500/15"
                      >
                        <td className="sticky left-0 z-10 bg-amber-50 dark:bg-amber-950 px-4 py-2 border-r border-amber-300/40 dark:border-amber-700/30">
                          <div className="flex items-center gap-2 min-w-0">
                            <AlertTriangle className="size-3 text-amber-500 shrink-0" />
                            <span className="text-xs font-semibold truncate text-amber-900 dark:text-amber-100">
                              {d.description}
                            </span>
                            {d.categoryName && (
                              <span
                                className="text-[10px] px-1.5 py-0.5 rounded-full border shrink-0"
                                style={
                                  d.categoryColor
                                    ? {
                                        borderColor: `${d.categoryColor}40`,
                                        backgroundColor: `${d.categoryColor}15`,
                                        color: d.categoryColor,
                                      }
                                    : undefined
                                }
                              >
                                {d.categoryName}
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5 font-semibold uppercase tracking-wide">
                            {t('budgets.report.directExpenseLabel', 'unplanned')}
                          </p>
                        </td>
                        {months.map((m) => (
                          <AmountCell
                            key={m}
                            value={d.expenses[m] ?? 0}
                            currency={currency}
                            className="text-amber-700 dark:text-amber-400 font-semibold"
                          />
                        ))}
                        <td className="px-3 py-2 text-left text-xs font-bold tabular-nums border-l border-amber-300/40 dark:border-amber-700/30 text-amber-700 dark:text-amber-400">
                          <FormattedCurrency amount={d.totalExpenses} currency={currency} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── TABLE 2: Summary ─── */}
          <div className="rounded-xl border overflow-clip">
            <div className="px-4 py-2 bg-muted/30 border-b border-border/40">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {t('budgets.report.summaryTable', 'Summary')}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b bg-muted/40">
                    <th className="sticky left-0 z-20 bg-card px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground min-w-48 border-r border-border/60">
                      {t('budgets.report.item', 'Item')}
                    </th>
                    {months.map((m) => {
                      const [y, mo] = m.split('-').map(Number)
                      const d = new Date(y, mo - 1, 1)
                      return (
                        <th
                          key={m}
                          className={cn(
                            'px-3 py-2.5 text-left text-xs font-medium min-w-24',
                            m > currentMonthStr
                              ? 'text-muted-foreground/40'
                              : 'text-muted-foreground',
                          )}
                        >
                          {format(d, 'MMM')}
                        </th>
                      )
                    })}
                    <th className="px-3 py-2.5 text-left text-xs font-bold min-w-26 border-l border-border/60">
                      {t('budgets.report.total', 'Total')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* Projected income */}
                  <tr className="border-b border-border/30 bg-blue-500/5">
                    <td className="sticky left-0 z-10 bg-blue-50 dark:bg-blue-950 px-4 py-2.5 text-xs font-bold border-r border-border/60 text-blue-600 dark:text-blue-400">
                      {t('budgets.report.projectedIncome', 'Projected Income')}
                      <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('budgets.report.projectedLabel', 'estimated')}
                      </span>
                    </td>
                    {months.map((m) => {
                      const val = projectedIncomePerMonth[m] ?? 0
                      return (
                        <td
                          key={m}
                          className={cn(
                            'px-3 py-2.5 text-left text-xs font-semibold tabular-nums text-blue-600 dark:text-blue-400',
                            m > currentMonthStr && 'opacity-70',
                          )}
                        >
                          {val > 0 ? (
                            <FormattedCurrency amount={val} currency={currency} />
                          ) : (
                            <span className="text-muted-foreground/25">—</span>
                          )}
                        </td>
                      )
                    })}
                    <td className="px-3 py-2.5 text-left text-xs font-bold tabular-nums border-l border-border/60 text-blue-600 dark:text-blue-400">
                      {projectedTotalIncome > 0 ? (
                        <FormattedCurrency amount={projectedTotalIncome} currency={currency} />
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>

                  {/* Total real income */}
                  <tr className="border-b border-border/40 bg-emerald-500/5">
                    <td className="sticky left-0 z-10 bg-emerald-50 dark:bg-emerald-950 px-4 py-2.5 text-xs font-bold border-r border-border/60 text-emerald-800 dark:text-emerald-300">
                      {t('budgets.report.totalIncome', 'Total Income')}
                      <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('budgets.report.realLabel', 'actual')}
                      </span>
                    </td>
                    {months.map((m) => (
                      <AmountCell
                        key={m}
                        value={reportData?.summary.income[m] ?? 0}
                        currency={currency}
                        className={cn(
                          'font-semibold text-emerald-700 dark:text-emerald-400',
                          m > currentMonthStr && 'opacity-30',
                        )}
                      />
                    ))}
                    <td className="px-3 py-2.5 text-left text-xs font-bold tabular-nums border-l border-border/60 text-emerald-700 dark:text-emerald-400">
                      <FormattedCurrency
                        amount={reportData?.summary.totalIncome ?? 0}
                        currency={currency}
                      />
                    </td>
                  </tr>

                  {/* Projected expenses */}
                  <tr className="border-b border-border/30 bg-blue-500/5">
                    <td className="sticky left-0 z-10 bg-blue-50 dark:bg-blue-950 px-4 py-2.5 text-xs font-bold border-r border-border/60 text-blue-600 dark:text-blue-400">
                      {t('budgets.report.projectedExpenses', 'Projected Expenses')}
                      <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('budgets.report.projectedLabel', 'estimated')}
                      </span>
                    </td>
                    {months.map((m) => {
                      const val = projectedExpensesPerMonth[m] ?? 0
                      return (
                        <td
                          key={m}
                          className={cn(
                            'px-3 py-2.5 text-left text-xs font-semibold tabular-nums text-blue-600 dark:text-blue-400',
                            m > currentMonthStr && 'opacity-70',
                          )}
                        >
                          {val > 0 ? (
                            <FormattedCurrency amount={val} currency={currency} />
                          ) : (
                            <span className="text-muted-foreground/25">—</span>
                          )}
                        </td>
                      )
                    })}
                    <td className="px-3 py-2.5 text-left text-xs font-bold tabular-nums border-l border-border/60 text-blue-600 dark:text-blue-400">
                      {projectedTotalExpenses > 0 ? (
                        <FormattedCurrency amount={projectedTotalExpenses} currency={currency} />
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>

                  {/* Total real expenses */}
                  <tr className="border-b border-border/40 bg-red-500/5">
                    <td className="sticky left-0 z-10 bg-red-50 dark:bg-red-950 px-4 py-2.5 text-xs font-bold border-r border-border/60 text-red-700 dark:text-red-400">
                      {t('budgets.report.totalExpenses', 'Total Expenses')}
                      <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('budgets.report.realLabel', 'actual')}
                      </span>
                    </td>
                    {months.map((m) => (
                      <AmountCell
                        key={m}
                        value={reportData?.summary.expenses[m] ?? 0}
                        currency={currency}
                        className={cn(
                          'font-semibold text-red-600 dark:text-red-400',
                          m > currentMonthStr && 'opacity-30',
                        )}
                      />
                    ))}
                    <td className="px-3 py-2.5 text-left text-xs font-bold tabular-nums border-l border-border/60 text-red-600 dark:text-red-400">
                      <FormattedCurrency
                        amount={reportData?.summary.totalExpenses ?? 0}
                        currency={currency}
                      />
                    </td>
                  </tr>

                  {/* Projected balance */}
                  <tr className="border-b border-border/30 bg-blue-500/15 dark:bg-blue-500/10">
                    <td className="sticky left-0 z-10 bg-blue-100 dark:bg-blue-950 px-4 py-2.5 text-xs font-bold border-r border-border/60 text-blue-600 dark:text-blue-400">
                      {t('budgets.report.projectedBalance', 'Projected Balance')}
                      <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('budgets.report.projectedLabel', 'estimated')}
                      </span>
                    </td>
                    {months.map((m) => {
                      const bal =
                        (projectedIncomePerMonth[m] ?? 0) - (projectedExpensesPerMonth[m] ?? 0)
                      return (
                        <td
                          key={m}
                          className={cn(
                            'px-3 py-2.5 text-left text-xs font-semibold tabular-nums',
                            bal > 0
                              ? 'text-blue-600 dark:text-blue-400'
                              : bal < 0
                                ? 'text-orange-500 dark:text-orange-400'
                                : 'text-muted-foreground/25',
                          )}
                        >
                          {bal === 0 ? '—' : <FormattedCurrency amount={bal} currency={currency} />}
                        </td>
                      )
                    })}
                    <td
                      className={cn(
                        'px-3 py-2.5 text-left text-xs font-bold tabular-nums border-l border-border/60',
                        projectedTotalIncome - projectedTotalExpenses > 0
                          ? 'text-blue-600 dark:text-blue-400'
                          : projectedTotalIncome - projectedTotalExpenses < 0
                            ? 'text-orange-500 dark:text-orange-400'
                            : 'text-muted-foreground',
                      )}
                    >
                      <FormattedCurrency
                        amount={projectedTotalIncome - projectedTotalExpenses}
                        currency={currency}
                      />
                    </td>
                  </tr>

                  {/* Balance */}
                  <tr className="border-b border-border/40 bg-slate-500/10 dark:bg-slate-500/15">
                    <td className="sticky left-0 z-10 bg-slate-100 dark:bg-slate-900 px-4 py-2.5 text-xs font-bold border-r border-border/60">
                      {t('budgets.report.balance', 'Balance')}
                      <span className="block text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                        {t('budgets.report.realLabel', 'actual')}
                      </span>
                    </td>
                    {months.map((m) => {
                      const bal = reportData?.summary.balance[m] ?? 0
                      const isFuture = m > currentMonthStr
                      return (
                        <td
                          key={m}
                          className={cn(
                            'px-3 py-2.5 text-left text-xs font-semibold tabular-nums',
                            isFuture
                              ? 'text-muted-foreground/20'
                              : bal > 0
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : bal < 0
                                  ? 'text-red-600 dark:text-red-400'
                                  : 'text-muted-foreground/30',
                          )}
                        >
                          {bal === 0 || isFuture ? (
                            '—'
                          ) : (
                            <span className="flex items-center justify-start gap-1">
                              {bal < 0 && (
                                <AlertTriangle className="size-3 text-red-500 shrink-0" />
                              )}
                              <FormattedCurrency amount={bal} currency={currency} />
                            </span>
                          )}
                        </td>
                      )
                    })}
                    <td
                      className={cn(
                        'px-3 py-2.5 text-left text-xs font-bold tabular-nums border-l border-border/60',
                        (reportData?.summary.totalBalance ?? 0) > 0
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : (reportData?.summary.totalBalance ?? 0) < 0
                            ? 'text-red-600 dark:text-red-400'
                            : 'text-muted-foreground',
                      )}
                    >
                      <FormattedCurrency
                        amount={reportData?.summary.totalBalance ?? 0}
                        currency={currency}
                      />
                    </td>
                  </tr>

                  {/* Accumulated expenses */}
                  <tr className="bg-orange-500/10 dark:bg-orange-500/8">
                    <td className="sticky left-0 z-10 bg-orange-50 dark:bg-orange-950 px-4 py-2.5 text-xs font-semibold text-muted-foreground border-r border-border/60">
                      {t('budgets.report.accumExpenses', 'Acum. Expenses')}
                      <span className="block text-[10px] font-semibold uppercase tracking-wide">
                        {t('budgets.report.realLabel', 'actual')}
                      </span>
                    </td>
                    {months.map((m) => {
                      const accum = accumExpenses[m] ?? 0
                      const isFuture = m > currentMonthStr
                      return (
                        <td
                          key={m}
                          className={cn(
                            'px-3 py-2.5 text-left text-xs tabular-nums text-foreground/60',
                            isFuture && 'opacity-20',
                          )}
                        >
                          {accum > 0 ? (
                            <FormattedCurrency amount={accum} currency={currency} />
                          ) : (
                            '—'
                          )}
                        </td>
                      )
                    })}
                    <td className="px-3 py-2.5 text-left text-xs font-bold tabular-nums border-l border-border/60 text-foreground/60">
                      <FormattedCurrency
                        amount={reportData?.summary.totalExpenses ?? 0}
                        currency={currency}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
