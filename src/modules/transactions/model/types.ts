export interface Transaction {
  id: string
  customer: {
    name: string | null
    email: string | null
  }
  customerName?: string | null
  customerEmail?: string | null
  status: 'Approved' | 'Pending' | 'Rejected'
  date: string
  amount: number
  paymentMethod?: string | null
  description?: string | null
  userId: string | null
  projectId: string | null
  categoryId?: string | null
  assignedAdminId?: string | null
  approvedBy?: string | null
  approvedAt?: string | null
  rejectionReason?: string | null
  budgetId?: string | null
  isPrivate?: boolean
  createdAt?: string
  updatedAt?: string
}
