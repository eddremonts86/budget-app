export interface Todo {
  id: string
  title: string
  description: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  dueDate: string
  createdBy: string
  assignedTo: string
  projectId: string
  createdAt: string
  updatedAt: string
}
