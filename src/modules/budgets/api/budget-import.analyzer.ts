/**
 * Budget Import Analyzer
 *
 * Detects recurring transactions and classifies income vs expense
 * from a list of parsed raw transactions.
 */

import type { RawTransaction } from './budget-import.parser'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type RecurrenceFrequency = 'weekly' | 'monthly' | 'quarterly' | 'semiannual' | 'annual'

export interface DetectedRecurrence {
  description: string
  normalizedKey: string
  frequency: RecurrenceFrequency
  intervalDays: number
  averageAmount: number
  amounts: number[] // all individual occurrence amounts
  type: 'income' | 'expense'
  occurrences: number
  dates: string[] // ISO date strings of all occurrences
  lastDate: string
  confidence: number // 0–1
  /** Keys of form "${date}::${description}" for every tx in this cluster */
  txKeys: string[]
}

export interface AiSuggestion {
  description: string
  currentClassification: 'recurring' | 'direct'
  suggestedClassification: 'recurring' | 'direct'
  reason: string
  suggestedFrequency?: RecurrenceFrequency
}

export interface TransactionSummary {
  totalIncome: number
  totalExpenses: number
  netBalance: number
  transactionCount: number
  incomeCount: number
  expenseCount: number
  dateFrom: string
  dateTo: string
  currency?: string
}

export interface ImportAnalysis {
  recurrences: DetectedRecurrence[]
  oneTimers: RawTransaction[] // non-recurring transactions
  summary: TransactionSummary
  suggestedBudgetName?: string
  suggestedPeriod?: 'monthly' | 'annual'
  aiSuggestions?: AiSuggestion[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Normalization
// ─────────────────────────────────────────────────────────────────────────────

// Strip legal suffixes and generic noise that doesn't help group transactions
const NOISE_PATTERNS = [
  /\b(a\/s|aps|as|gmbh|ltd|llc|inc|srl|bv|nv|plc|oy|ab|ag)\b/gi,
  /\b(bs|til|fra|overfort|overf.rt)\b/gi, // Danish bank prefixes
  // Remove amounts embedded in descriptions (e.g. "1.234,56" or "1234.56")
  /\b\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\b/g,
  // Remove date patterns: DD-MM-YYYY, YYYY-MM-DD, DD/MM, etc.
  /\b\d{1,2}[.\-\/]\d{1,2}([.\-\/]\d{2,4})?\b/g,
  /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/gi,
  /\b(\d{4,})\b/g, // remaining long numbers (account numbers in description)
  /\b(dkk|eur|usd|gbp|kr)\b/gi, // currency codes
  /[^a-z0-9\s]/gi,
]

function normalizeDescription(desc: string): string {
  let s = desc.toLowerCase().trim()
  for (const pattern of NOISE_PATTERNS) {
    s = s.replace(pattern, ' ')
  }
  return s.replace(/\s+/g, ' ').trim()
}

// ─────────────────────────────────────────────────────────────────────────────
// Interval detection
// ─────────────────────────────────────────────────────────────────────────────

function daysBetween(a: string, b: string): number {
  const msA = new Date(a).getTime()
  const msB = new Date(b).getTime()
  return Math.round(Math.abs(msB - msA) / (1000 * 60 * 60 * 24))
}

function classifyInterval(
  avgDays: number,
): { frequency: RecurrenceFrequency; days: number } | null {
  // Tolerance ±35%
  const ranges: Array<{ min: number; max: number; frequency: RecurrenceFrequency; days: number }> =
    [
      { min: 5, max: 10, frequency: 'weekly', days: 7 },
      { min: 20, max: 45, frequency: 'monthly', days: 30 },
      { min: 70, max: 110, frequency: 'quarterly', days: 91 },
      { min: 150, max: 200, frequency: 'semiannual', days: 182 },
      { min: 300, max: 400, frequency: 'annual', days: 365 },
    ]

  for (const r of ranges) {
    if (avgDays >= r.min && avgDays <= r.max) {
      return { frequency: r.frequency, days: r.days }
    }
  }
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Similarity matching
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute word overlap similarity between two normalized strings.
 * Uses bigram overlap for short strings, word Jaccard for longer ones.
 * Returns 0–1 (1 = identical).
 */
function similarity(a: string, b: string): number {
  const wordsA = a.split(' ').filter((w) => w.length >= 3)
  const wordsB = b.split(' ').filter((w) => w.length >= 3)
  if (wordsA.length === 0 || wordsB.length === 0) return a === b ? 1 : 0

  const setA = new Set(wordsA)
  const setB = new Set(wordsB)

  let intersection = 0
  for (const w of setA) {
    if (setB.has(w)) intersection++
  }
  const union = setA.size + setB.size - intersection
  const jaccardScore = union > 0 ? intersection / union : 0

  // Prefix bonus: if both share a 5+ char prefix on first significant word
  const prefixBonus =
    wordsA[0] && wordsB[0] && wordsA[0].length >= 5 && wordsB[0].startsWith(wordsA[0].slice(0, 5))
      ? 0.15
      : 0

  return Math.min(1, jaccardScore + prefixBonus)
}

// ─────────────────────────────────────────────────────────────────────────────
// Group similar transactions into clusters
// ─────────────────────────────────────────────────────────────────────────────

interface Cluster {
  key: string
  transactions: RawTransaction[]
}

/**
 * Groups transactions by normalized description similarity.
 * Also considers same-sign amounts to avoid mixing income with expenses.
 */
function clusterTransactions(transactions: RawTransaction[]): Cluster[] {
  const clusters: Cluster[] = []

  for (const tx of transactions) {
    const norm = normalizeDescription(tx.description)
    if (!norm || norm.length < 2) continue

    const txSign = tx.amount >= 0 ? 1 : -1

    // Find the best matching cluster with same income/expense sign
    let bestScore = 0
    let bestCluster: Cluster | null = null
    for (const cluster of clusters) {
      const clusterSign = cluster.transactions[0].amount >= 0 ? 1 : -1
      if (clusterSign !== txSign) continue // never mix income and expenses

      const score = similarity(norm, cluster.key)
      if (score >= 0.45 && score > bestScore) {
        bestScore = score
        bestCluster = cluster
      }
    }

    if (bestCluster) {
      bestCluster.transactions.push(tx)
    } else {
      clusters.push({ key: norm, transactions: [tx] })
    }
  }

  return clusters
}

// ─────────────────────────────────────────────────────────────────────────────
// Main analyzer
// ─────────────────────────────────────────────────────────────────────────────

export function analyzeTransactions(transactions: RawTransaction[]): ImportAnalysis {
  if (transactions.length === 0) {
    return {
      recurrences: [],
      oneTimers: [],
      summary: {
        totalIncome: 0,
        totalExpenses: 0,
        netBalance: 0,
        transactionCount: 0,
        incomeCount: 0,
        expenseCount: 0,
        dateFrom: '',
        dateTo: '',
      },
    }
  }

  // Sort by date ascending
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date))

  const clusters = clusterTransactions(sorted)
  const recurrences: DetectedRecurrence[] = []
  const recurringDescriptions = new Set<string>()

  for (const cluster of clusters) {
    const txs = cluster.transactions
    if (txs.length < 2) continue

    // Sort cluster by date
    const clusterSorted = [...txs].sort((a, b) => a.date.localeCompare(b.date))
    const dates = clusterSorted.map((t) => t.date)

    // Compute average interval
    const intervals: number[] = []
    for (let i = 1; i < dates.length; i++) {
      intervals.push(daysBetween(dates[i - 1], dates[i]))
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length

    const classified = classifyInterval(avgInterval)
    if (!classified) continue

    // Compute average amount (absolute)
    const avgAmount = txs.reduce((sum, t) => sum + t.amount, 0) / txs.length
    const amounts = txs.map((t) => t.amount)

    // Build txKeys for later use in the apply step
    const txKeys = txs.map((t) => `${t.date}::${t.description}`)

    // Confidence: based on interval consistency and occurrence count
    const stdDev = Math.sqrt(
      intervals.reduce((acc, v) => acc + Math.pow(v - avgInterval, 2), 0) / intervals.length,
    )
    const cvCoefficient = avgInterval > 0 ? stdDev / avgInterval : 1
    const consistencyScore = Math.max(0, 1 - cvCoefficient * 1.5)
    // Reach full confidence at 3+ occurrences for monthly/quarterly, 2 for annual
    const minForFullConfidence =
      classified.frequency === 'annual' || classified.frequency === 'semiannual' ? 2 : 3
    const occurrenceScore = Math.min(txs.length / minForFullConfidence, 1)
    const confidence = consistencyScore * 0.55 + occurrenceScore * 0.45

    const type = avgAmount >= 0 ? 'income' : 'expense'
    const canonicalDescription = clusterSorted[clusterSorted.length - 1].description

    recurrences.push({
      description: canonicalDescription,
      normalizedKey: cluster.key,
      frequency: classified.frequency,
      intervalDays: classified.days,
      averageAmount: avgAmount,
      amounts,
      type,
      occurrences: txs.length,
      dates,
      lastDate: dates[dates.length - 1],
      confidence: Math.round(confidence * 100) / 100,
      txKeys,
    })

    for (const tx of txs) {
      recurringDescriptions.add(normalizeDescription(tx.description))
    }
  }

  // Sort recurrences: highest confidence first, then by abs amount
  recurrences.sort((a, b) => {
    const confDiff = b.confidence - a.confidence
    if (Math.abs(confDiff) > 0.05) return confDiff
    return Math.abs(b.averageAmount) - Math.abs(a.averageAmount)
  })

  // Non-recurring transactions — exclude any tx whose exact date+description key
  // matches a recurring cluster (avoids partial splits for variable-amount series)
  const recurringTxKeySet = new Set<string>()
  for (const rec of recurrences) {
    for (const key of rec.txKeys) {
      recurringTxKeySet.add(key)
    }
  }
  // Also exclude by normalized description for any remaining stragglers
  const recurringNormDescSet = new Set(recurrences.map((r) => r.normalizedKey))

  const oneTimers = sorted.filter((tx) => {
    const key = `${tx.date}::${tx.description}`
    if (recurringTxKeySet.has(key)) return false
    const norm = normalizeDescription(tx.description)
    return !recurringNormDescSet.has(norm)
  })

  // Summary
  let totalIncome = 0
  let totalExpenses = 0
  let incomeCount = 0
  let expenseCount = 0

  for (const tx of sorted) {
    if (tx.amount > 0) {
      totalIncome += tx.amount
      incomeCount++
    } else {
      totalExpenses += Math.abs(tx.amount)
      expenseCount++
    }
  }

  const dates = sorted.map((t) => t.date)
  const summary: TransactionSummary = {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    transactionCount: sorted.length,
    incomeCount,
    expenseCount,
    dateFrom: dates[0] ?? '',
    dateTo: dates[dates.length - 1] ?? '',
  }

  // Suggest budget name from account name or top description
  const accountName = sorted.find((t) => t.accountName)?.accountName
  const suggestedBudgetName = accountName ?? undefined

  // Suggest period from date range
  const rangeDays =
    summary.dateFrom && summary.dateTo ? daysBetween(summary.dateFrom, summary.dateTo) : 0
  const suggestedPeriod: 'monthly' | 'annual' = rangeDays > 180 ? 'annual' : 'monthly'

  return {
    recurrences,
    oneTimers,
    summary,
    suggestedBudgetName,
    suggestedPeriod,
  }
}
