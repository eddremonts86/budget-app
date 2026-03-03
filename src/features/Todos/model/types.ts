export interface Todo {
  id: string
  title: string
  description: string | null
  status: 'pending' | 'in_progress' | 'completed' | 'on_hold' | 'testing' | 'blocked' | 'cancelled'
  priority: 'low' | 'medium' | 'high'
  dueDate: string
  completedAt: string | null
  createdBy: string | null
  assignedTo: string | null
  projectId: string | null
  categoryId: string | null
  complexity: number | null
  estimatedTime: number | null
  actualTime: number | null
  dependencies: string[] | null
  acceptanceCriteria: string | null
  createdAt: string
  updatedAt: string
}
