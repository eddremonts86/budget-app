export interface Transaction {
  id: string
  customer: {
    name: string
    email: string
  }
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
}
