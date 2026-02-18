export interface Transaction {
  id: string
  customer: {
    name: string
    email: string
  }
  status: 'Approved' | 'Pending' | 'Rejected'
  date: string
  amount: number
  userId: string
  projectId: string
  assignedAdminId?: string
  approvedBy?: string
  approvedAt?: string
  rejectionReason?: string
}
