export interface StatValue {
  value: number
  change: number
  trend: 'up' | 'down'
  context?: string
}

export interface DashboardStats {
  revenue: StatValue
  subscriptions: StatValue
  sales: StatValue
  activeNow: StatValue
}

export interface Transaction {
  id: string
  customer: {
    name: string
    email: string
  }
  status: string
  date: string
  amount: number
}
