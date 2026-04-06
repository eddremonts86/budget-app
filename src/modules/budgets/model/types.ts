export type BudgetScope = 'personal' | 'project' | 'department' | 'company'
export type BudgetStatus = 'active' | 'closed' | 'archived'
export type BudgetPeriodType = 'monthly' | 'quarterly' | 'semiannual' | 'annual' | 'one_time'
export type BudgetMemberRole = 'admin' | 'contributor' | 'viewer'
export type BudgetRecurrenceFrequency =
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'quarterly'
  | 'semiannual'
  | 'annual'
export type BudgetRecurrenceStatus = 'active' | 'paused' | 'completed'
export type BudgetHealthStatus =
  | 'healthy'
  | 'on_track'
  | 'warning'
  | 'approaching'
  | 'over_budget'
  | 'no_limit'

export interface Budget {
  id: string
  name: string
  description: string | null
  scope: BudgetScope
  projectId: string | null
  departmentId: string | null
  ownerId: string
  targetAmount: number | null
  currency: string
  periodType: BudgetPeriodType
  startDate: string
  endDate: string | null
  status: BudgetStatus
  isActive: boolean
  createdAt: string
  updatedAt: string
  // Computed fields
  health?: BudgetHealthSummary
  memberCount?: number
}

export interface BudgetMember {
  budgetId: string
  userId: string
  role: BudgetMemberRole
  joinedAt: string
  userName?: string | null
  userEmail?: string | null
  userAvatar?: string | null
}

export interface BudgetCategoryLimit {
  budgetId: string
  categoryId: string
  allocatedAmount: number
  categoryName?: string
  categoryColor?: string
  spent?: number
}

export interface BudgetRecurrenceRule {
  id: string
  budgetId: string
  categoryId: string | null
  userId: string
  amount: number
  frequency: BudgetRecurrenceFrequency
  interval: number
  description: string | null
  startDate: string
  nextDate: string
  lastRunAt: string | null
  status: BudgetRecurrenceStatus
  pausedReason: string | null
  createdAt: string
  updatedAt: string
  categoryName?: string
  categoryColor?: string
}

export interface BudgetHealthSummary {
  budgetId: string
  spent: number
  income: number
  balance: number
  target: number | null
  remaining: number | null
  usagePct: number | null
  status: BudgetHealthStatus
  overBy: number
  periodStart: string
  periodEnd: string
}

export interface BudgetAlert {
  budgetId: string
  budgetName: string
  status: BudgetHealthStatus
  spent: number
  target: number | null
  overBy: number
}

export interface PeriodBounds {
  start: Date
  end: Date
}

export interface BudgetDashboardData {
  totalBalance: number
  totalIncome: number
  totalExpenses: number
  overBudgetCount: number
  budgets: (Budget & { health: BudgetHealthSummary })[]
}
