import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'
import { format } from 'date-fns'

import type { BudgetRecurrenceFrequency } from '../model/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface PdfRuleRow {
  id: string
  description: string | null
  frequency: BudgetRecurrenceFrequency
  interval: number
  amount: number
  status: 'active' | 'paused' | 'completed'
  categoryName: string | null
}

export interface PdfDirectTransaction {
  description: string
  categoryName: string | null
  expenses: Record<string, number>
  income: Record<string, number>
  totalExpenses: number
  totalIncome: number
}

export interface PdfReportSummary {
  income: Record<string, number>
  expenses: Record<string, number>
  balance: Record<string, number>
  totalIncome: number
  totalExpenses: number
  totalBalance: number
}

export interface BudgetAnnualReportPdfProps {
  budgetName: string
  year: number
  currency: string
  months: string[]
  incomeRules: PdfRuleRow[]
  expenseRules: PdfRuleRow[]
  fireMonthsById: Record<string, string[]>
  projectedIncomePerMonth: Record<string, number>
  projectedExpensesPerMonth: Record<string, number>
  projectedTotalIncome: number
  projectedTotalExpenses: number
  directTransactions: PdfDirectTransaction[]
  summary: PdfReportSummary
}

// ---------------------------------------------------------------------------
// Color palette
// ---------------------------------------------------------------------------
const C = {
  white: '#ffffff',
  ink: '#111827',
  muted: '#6b7280',
  border: '#e5e7eb',
  rowAlt: '#f9fafb',
  incomeSection: '#dcfce7',
  incomeText: '#15803d',
  totalIncomeBg: '#f0fdf4',
  expenseSection: '#fee2e2',
  expenseText: '#b91c1c',
  totalExpenseBg: '#fef2f2',
  projectedBg: '#eff6ff',
  projectedText: '#2563eb',
  balanceBg: '#f8fafc',
  accumBg: '#fff7ed',
  accumText: '#92400e',
  mutedDash: '#d1d5db',
}

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------
const ITEM_W = 130
const MONTH_W = 44
const TOTAL_W = 54

// ---------------------------------------------------------------------------
// StyleSheet
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 7,
    color: C.ink,
    backgroundColor: C.white,
    paddingTop: 24,
    paddingBottom: 28,
    paddingHorizontal: 22,
  },
  header: { marginBottom: 10 },
  headerTitle: { fontSize: 13, fontFamily: 'Helvetica-Bold', marginBottom: 2 },
  headerMeta: { fontSize: 7, color: C.muted },
  table: { borderWidth: 1, borderColor: C.border, borderRadius: 3 },
  // Column header
  colHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    height: 16,
    alignItems: 'center',
  },
  colHeaderItem: {
    width: ITEM_W,
    paddingHorizontal: 6,
    fontFamily: 'Helvetica-Bold',
    fontSize: 6.5,
    color: C.muted,
    borderRightWidth: 1,
    borderRightColor: C.border,
    height: 16,
    justifyContent: 'center',
  },
  colHeaderMonth: {
    width: MONTH_W,
    paddingHorizontal: 3,
    fontFamily: 'Helvetica-Bold',
    fontSize: 6,
    color: C.muted,
    height: 16,
    justifyContent: 'center',
  },
  colHeaderTotal: {
    width: TOTAL_W,
    paddingHorizontal: 4,
    fontFamily: 'Helvetica-Bold',
    fontSize: 6.5,
    color: C.ink,
    borderLeftWidth: 1,
    borderLeftColor: C.border,
    height: 16,
    justifyContent: 'center',
  },
  // Section header
  sectionRow: {
    flexDirection: 'row',
    height: 13,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  sectionText: {
    paddingHorizontal: 6,
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
  },
  // Data row
  dataRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    minHeight: 14,
    alignItems: 'center',
  },
  itemCell: {
    width: ITEM_W,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRightWidth: 1,
    borderRightColor: C.border,
    justifyContent: 'center',
  },
  itemName: { fontSize: 6.5, fontFamily: 'Helvetica-Bold' },
  itemSub: { fontSize: 5.5, color: C.muted, marginTop: 1 },
  amountCell: {
    width: MONTH_W,
    paddingHorizontal: 3,
    paddingVertical: 2,
    justifyContent: 'center',
  },
  amountText: { fontSize: 6 },
  dashText: { fontSize: 6, color: C.mutedDash },
  totalCell: {
    width: TOTAL_W,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderLeftWidth: 1,
    borderLeftColor: C.border,
    justifyContent: 'center',
  },
  totalText: { fontSize: 6.5, fontFamily: 'Helvetica-Bold' },
  // Summary row
  summaryRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    minHeight: 16,
    alignItems: 'center',
  },
  summaryLabel: {
    width: ITEM_W,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRightWidth: 1,
    borderRightColor: C.border,
    justifyContent: 'center',
  },
  summaryLabelText: { fontSize: 6.5, fontFamily: 'Helvetica-Bold' },
  summaryLabelSub: { fontSize: 5.5, color: C.muted, marginTop: 1 },
  // Empty
  emptyRow: {
    flexDirection: 'row',
    height: 14,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  emptyText: { paddingHorizontal: 6, fontSize: 6.5, color: C.muted },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 12,
    left: 22,
    right: 22,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 6, color: C.muted },
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function splitAmount(cents: number, currency: string): { code: string; number: string } {
  const parts = new Intl.NumberFormat('en-US', { style: 'currency', currency }).formatToParts(
    cents / 100,
  )
  let code = ''
  const numParts: string[] = []
  let afterCode = false
  for (const p of parts) {
    if (p.type === 'currency') {
      code = p.value
      afterCode = true
    } else if (p.type === 'literal' && afterCode && numParts.length === 0) {
      // swallow space after currency code
    } else {
      numParts.push(p.value)
    }
  }
  return { code, number: numParts.join('') }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PdfAmount({ cents, currency, style }: { cents: number; currency: string; style?: any }) {
  const { code, number } = splitAmount(cents, currency)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
      <Text style={{ fontSize: 4.5, color: '#9ca3af', marginRight: 1 }}>{code}</Text>
      <Text style={style}>{number}</Text>
    </View>
  )
}

function monthLabel(m: string): string {
  const [y, mo] = m.split('-').map(Number)
  return format(new Date(y, mo - 1, 1), 'MMM')
}

function freqLabel(freq: BudgetRecurrenceFrequency, interval: number): string {
  const map: Record<BudgetRecurrenceFrequency, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    semiannual: 'Semiannual',
    annual: 'Annual',
  }
  const base = map[freq] ?? freq
  return interval > 1 ? `${base} ×${interval}` : base
}

// ---------------------------------------------------------------------------
// Column header row
// ---------------------------------------------------------------------------
function ColHeaderRow({ months }: { months: string[] }) {
  return (
    <View style={s.colHeaderRow}>
      <View style={s.colHeaderItem}>
        <Text>Item</Text>
      </View>
      {months.map((m) => (
        <View key={m} style={s.colHeaderMonth}>
          <Text>{monthLabel(m)}</Text>
        </View>
      ))}
      <View style={s.colHeaderTotal}>
        <Text>Total</Text>
      </View>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------
function PdfSectionHeader({ label, bg, color }: { label: string; bg: string; color: string }) {
  return (
    <View style={[s.sectionRow, { backgroundColor: bg }]}>
      <Text style={[s.sectionText, { color }]}>{label}</Text>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Rule row (recurring)
// ---------------------------------------------------------------------------
function RuleRow({
  rule,
  months,
  fireMonths,
  amountColor,
  currency,
  isAlt,
}: {
  rule: PdfRuleRow
  months: string[]
  fireMonths: string[]
  amountColor: string
  currency: string
  isAlt: boolean
}) {
  const fireSet = new Set(fireMonths)
  const absAmount = Math.abs(rule.amount)
  const total = fireMonths.length * absAmount

  return (
    <View style={[s.dataRow, { backgroundColor: isAlt ? C.rowAlt : C.white }]}>
      <View style={s.itemCell}>
        <Text style={[s.itemName, rule.status === 'paused' ? { color: C.muted } : {}]}>
          {rule.description ?? '—'}
          {rule.status === 'paused' ? ' (paused)' : ''}
        </Text>
        <Text style={s.itemSub}>
          {freqLabel(rule.frequency, rule.interval)}
          {rule.categoryName ? `  ·  ${rule.categoryName}` : ''}
        </Text>
      </View>
      {months.map((m) => {
        const val = fireSet.has(m) ? absAmount : 0
        return (
          <View key={m} style={s.amountCell}>
            {val > 0 ? (
              <PdfAmount
                cents={val}
                currency={currency}
                style={[s.amountText, { color: amountColor }]}
              />
            ) : (
              <Text style={s.dashText}>—</Text>
            )}
          </View>
        )
      })}
      <View style={s.totalCell}>
        {total > 0 ? (
          <PdfAmount
            cents={total}
            currency={currency}
            style={[s.totalText, { color: amountColor }]}
          />
        ) : (
          <Text style={s.dashText}>—</Text>
        )}
      </View>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Direct transaction row
// ---------------------------------------------------------------------------
function DirectRow({
  tx,
  months,
  type,
  amountColor,
  currency,
  isAlt,
}: {
  tx: PdfDirectTransaction
  months: string[]
  type: 'income' | 'expense'
  amountColor: string
  currency: string
  isAlt: boolean
}) {
  const total = type === 'income' ? tx.totalIncome : tx.totalExpenses
  return (
    <View style={[s.dataRow, { backgroundColor: isAlt ? C.rowAlt : C.white }]}>
      <View style={s.itemCell}>
        <Text style={s.itemName}>{tx.description}</Text>
        <Text style={s.itemSub}>
          {'direct'}
          {tx.categoryName ? `  ·  ${tx.categoryName}` : ''}
        </Text>
      </View>
      {months.map((m) => {
        const val = type === 'income' ? (tx.income[m] ?? 0) : (tx.expenses[m] ?? 0)
        return (
          <View key={m} style={s.amountCell}>
            {val > 0 ? (
              <PdfAmount
                cents={val}
                currency={currency}
                style={[s.amountText, { color: amountColor }]}
              />
            ) : (
              <Text style={s.dashText}>—</Text>
            )}
          </View>
        )
      })}
      <View style={s.totalCell}>
        <PdfAmount
          cents={total}
          currency={currency}
          style={[s.totalText, { color: amountColor }]}
        />
      </View>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Summary / totals row
// ---------------------------------------------------------------------------
function SummaryRow({
  label,
  sub,
  months,
  amountsByMonth,
  total,
  amountColor,
  bg,
  currency,
  thickBottom,
}: {
  label: string
  sub?: string
  months: string[]
  amountsByMonth: Record<string, number>
  total: number
  amountColor: string
  bg: string
  currency: string
  thickBottom?: boolean
}) {
  return (
    <View
      style={[
        s.summaryRow,
        { backgroundColor: bg },
        thickBottom ? { borderBottomWidth: 2, borderBottomColor: '#d1d5db' } : {},
      ]}
    >
      <View style={[s.summaryLabel, { backgroundColor: bg }]}>
        <Text style={s.summaryLabelText}>{label}</Text>
        {sub ? <Text style={s.summaryLabelSub}>{sub}</Text> : null}
      </View>
      {months.map((m) => {
        const val = amountsByMonth[m] ?? 0
        return (
          <View key={m} style={s.amountCell}>
            {val !== 0 ? (
              <PdfAmount
                cents={val}
                currency={currency}
                style={[s.amountText, { color: amountColor, fontFamily: 'Helvetica-Bold' }]}
              />
            ) : (
              <Text style={s.dashText}>—</Text>
            )}
          </View>
        )
      })}
      <View style={[s.totalCell, { backgroundColor: bg }]}>
        <PdfAmount
          cents={total}
          currency={currency}
          style={[s.totalText, { color: amountColor }]}
        />
      </View>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Empty row
// ---------------------------------------------------------------------------
function EmptyRow() {
  return (
    <View style={s.emptyRow}>
      <Text style={s.emptyText}>No entries</Text>
    </View>
  )
}

// ---------------------------------------------------------------------------
// Main PDF Document
// ---------------------------------------------------------------------------
export function BudgetAnnualReportPdf({
  budgetName,
  year,
  currency,
  months,
  incomeRules,
  expenseRules,
  fireMonthsById,
  projectedIncomePerMonth,
  projectedExpensesPerMonth,
  projectedTotalIncome,
  projectedTotalExpenses,
  directTransactions,
  summary,
}: BudgetAnnualReportPdfProps) {
  const generatedAt = format(new Date(), 'PPP')

  const directIncome = directTransactions.filter((d) => d.totalIncome > 0)
  const directExpenses = directTransactions.filter((d) => d.totalExpenses > 0)

  const projBalanceByMonth: Record<string, number> = {}
  for (const m of months) {
    projBalanceByMonth[m] = (projectedIncomePerMonth[m] ?? 0) - (projectedExpensesPerMonth[m] ?? 0)
  }

  let running = 0
  const accumExpenses: Record<string, number> = {}
  for (const m of months) {
    running += summary.expenses[m] ?? 0
    accumExpenses[m] = running
  }

  return (
    <Document title={`${budgetName} — ${year} Annual Report`} author="Budget App">
      <Page size="A4" orientation="landscape" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>
            {budgetName} — Annual Report {year}
          </Text>
          <Text style={s.headerMeta}>
            Generated {generatedAt} · Amounts in {currency}
          </Text>
        </View>

        {/* Table */}
        <View style={s.table}>
          <ColHeaderRow months={months} />

          {/* ── INCOME ─────────────────────────────────────────────────── */}
          <PdfSectionHeader label="INCOME BY CATEGORY" bg={C.incomeSection} color={C.incomeText} />

          {incomeRules.length === 0 && directIncome.length === 0 ? (
            <EmptyRow />
          ) : (
            <>
              {incomeRules.map((rule, idx) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  months={months}
                  fireMonths={fireMonthsById[rule.id] ?? []}
                  amountColor={C.incomeText}
                  currency={currency}
                  isAlt={idx % 2 === 1}
                />
              ))}
              {directIncome.map((tx, idx) => (
                <DirectRow
                  key={`dinc-${tx.description}`}
                  tx={tx}
                  months={months}
                  type="income"
                  amountColor={C.incomeText}
                  currency={currency}
                  isAlt={(incomeRules.length + idx) % 2 === 1}
                />
              ))}
            </>
          )}

          <SummaryRow
            label="Projected Income"
            sub="estimated"
            months={months}
            amountsByMonth={projectedIncomePerMonth}
            total={projectedTotalIncome}
            amountColor={C.projectedText}
            bg={C.projectedBg}
            currency={currency}
          />
          <SummaryRow
            label="Total Income"
            sub="actual"
            months={months}
            amountsByMonth={summary.income}
            total={summary.totalIncome}
            amountColor={C.incomeText}
            bg={C.totalIncomeBg}
            currency={currency}
            thickBottom
          />

          {/* ── EXPENSES ───────────────────────────────────────────────── */}
          <PdfSectionHeader
            label="EXPENSES BY CATEGORY"
            bg={C.expenseSection}
            color={C.expenseText}
          />

          {expenseRules.length === 0 && directExpenses.length === 0 ? (
            <EmptyRow />
          ) : (
            <>
              {expenseRules.map((rule, idx) => (
                <RuleRow
                  key={rule.id}
                  rule={rule}
                  months={months}
                  fireMonths={fireMonthsById[rule.id] ?? []}
                  amountColor={C.expenseText}
                  currency={currency}
                  isAlt={idx % 2 === 1}
                />
              ))}
              {directExpenses.map((tx, idx) => (
                <DirectRow
                  key={`dexp-${tx.description}`}
                  tx={tx}
                  months={months}
                  type="expense"
                  amountColor={C.expenseText}
                  currency={currency}
                  isAlt={(expenseRules.length + idx) % 2 === 1}
                />
              ))}
            </>
          )}

          <SummaryRow
            label="Projected Expenses"
            sub="estimated"
            months={months}
            amountsByMonth={projectedExpensesPerMonth}
            total={projectedTotalExpenses}
            amountColor={C.projectedText}
            bg={C.projectedBg}
            currency={currency}
          />
          <SummaryRow
            label="Total Expenses"
            sub="actual"
            months={months}
            amountsByMonth={summary.expenses}
            total={summary.totalExpenses}
            amountColor={C.expenseText}
            bg={C.totalExpenseBg}
            currency={currency}
            thickBottom
          />

          {/* ── SUMMARY ────────────────────────────────────────────────── */}
          <SummaryRow
            label="Projected Balance"
            sub="estimated"
            months={months}
            amountsByMonth={projBalanceByMonth}
            total={projectedTotalIncome - projectedTotalExpenses}
            amountColor={C.projectedText}
            bg={C.projectedBg}
            currency={currency}
          />
          <SummaryRow
            label="Balance"
            sub="actual"
            months={months}
            amountsByMonth={summary.balance}
            total={summary.totalBalance}
            amountColor={summary.totalBalance >= 0 ? C.incomeText : C.expenseText}
            bg={C.balanceBg}
            currency={currency}
          />
          <SummaryRow
            label="Acum. Expenses"
            sub="actual"
            months={months}
            amountsByMonth={accumExpenses}
            total={summary.totalExpenses}
            amountColor={C.accumText}
            bg={C.accumBg}
            currency={currency}
          />
        </View>

        {/* Footer */}
        <View style={s.footer} fixed>
          <Text style={s.footerText}>
            {budgetName} — {year}
          </Text>
          <Text
            style={s.footerText}
            render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
