import type {
  BudgetHealthStatus,
  BudgetPeriodType,
  BudgetRecurrenceFrequency,
  PeriodBounds,
} from './types'

/**
 * Compute the current period bounds for a budget based on its period type and start date.
 * All calculations are done in UTC to avoid timezone drift.
 */
export function getCurrentPeriodBounds(
  periodType: BudgetPeriodType,
  startDate: Date,
  referenceDate: Date = new Date(),
): PeriodBounds {
  const now = new Date(referenceDate.getTime())
  const year = now.getUTCFullYear()
  const month = now.getUTCMonth()

  switch (periodType) {
    case 'monthly':
      return {
        start: new Date(Date.UTC(year, month, 1, 0, 0, 0, 0)),
        end: new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)),
      }

    case 'quarterly': {
      const currentQuarter = Math.floor(month / 3)
      return {
        start: new Date(Date.UTC(year, currentQuarter * 3, 1, 0, 0, 0, 0)),
        end: new Date(Date.UTC(year, currentQuarter * 3 + 3, 0, 23, 59, 59, 999)),
      }
    }

    case 'semiannual': {
      const currentHalf = month < 6 ? 0 : 1
      return {
        start: new Date(Date.UTC(year, currentHalf * 6, 1, 0, 0, 0, 0)),
        end: new Date(Date.UTC(year, currentHalf * 6 + 6, 0, 23, 59, 59, 999)),
      }
    }

    case 'annual':
      return {
        start: new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0)),
        end: new Date(Date.UTC(year, 12, 0, 23, 59, 59, 999)),
      }

    case 'one_time':
      return {
        start: startDate,
        end: new Date(Date.UTC(9999, 11, 31, 23, 59, 59, 999)),
      }

    default:
      return {
        start: new Date(Date.UTC(year, month, 1)),
        end: new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999)),
      }
  }
}

/**
 * Add months safely, handling month-end edge cases (e.g. Jan 31 + 1 = Feb 28).
 */
export function addMonthsSafe(date: Date, months: number): Date {
  const result = new Date(date.getTime())
  const day = result.getUTCDate()
  result.setUTCMonth(result.getUTCMonth() + months)

  // Handle overflow (e.g. Jan 31 → Feb 31 → Mar 3)
  if (result.getUTCDate() !== day) {
    result.setUTCDate(0) // Set to last day of previous month
  }

  return result
}

/**
 * Compute the next execution date for a recurrence rule.
 */
export function computeNextDate(
  frequency: BudgetRecurrenceFrequency,
  interval: number,
  fromDate: Date,
): Date {
  switch (frequency) {
    case 'daily': {
      const d = new Date(fromDate.getTime())
      d.setUTCDate(d.getUTCDate() + interval)
      return d
    }
    case 'weekly': {
      const d = new Date(fromDate.getTime())
      d.setUTCDate(d.getUTCDate() + 7 * interval)
      return d
    }
    case 'monthly':
      return addMonthsSafe(fromDate, interval)
    case 'quarterly':
      return addMonthsSafe(fromDate, 3 * interval)
    case 'semiannual':
      return addMonthsSafe(fromDate, 6 * interval)
    case 'annual':
      return addMonthsSafe(fromDate, 12 * interval)
    default:
      return addMonthsSafe(fromDate, interval)
  }
}

/**
 * Format amount in cents to currency display string.
 */
export function formatAmount(amountCents: number, currency = 'USD', locale = 'en-US'): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amountCents / 100)
}

/**
 * Compute budget health status from usage percentage.
 */
export function computeHealthStatus(
  spent: number,
  target: number | null,
): { status: BudgetHealthStatus; usagePct: number | null; overBy: number } {
  if (target === null || target === 0) {
    return { status: 'no_limit', usagePct: null, overBy: 0 }
  }

  const usagePct = (spent / target) * 100
  const overBy = Math.max(0, spent - target)

  if (usagePct >= 100) return { status: 'over_budget', usagePct, overBy }
  if (usagePct >= 90) return { status: 'approaching', usagePct, overBy: 0 }
  if (usagePct >= 80) return { status: 'warning', usagePct, overBy: 0 }
  if (usagePct >= 50) return { status: 'on_track', usagePct, overBy: 0 }
  return { status: 'healthy', usagePct, overBy: 0 }
}
