export interface Todo {
  id: string
  title: string
  description: string | null
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  dueDate: string
  createdBy: string | null
  assignedTo: string | null
  projectId: string | null
  createdAt: string
  updatedAt: string
}
