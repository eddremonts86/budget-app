export type TodoStatus = 'pending' | 'in_progress' | 'completed'
export type TodoPriority = 'low' | 'medium' | 'high'

export interface Todo {
  id: string
  title: string
  description: string
  status: TodoStatus
  priority: TodoPriority
  dueDate: string
  createdAt: string
  updatedAt: string
}

export interface TodoPage {
  items: Todo[]
  page: number
  limit: number
  total: number
}

export interface CreateTodoInput {
  title: string
  description?: string
  status?: TodoStatus
  priority: TodoPriority
  dueDate: string
}

export interface UpdateTodoInput extends Partial<CreateTodoInput> {
  id: string
}

export interface TodoFilters {
  status?: TodoStatus
  priority?: TodoPriority
  _sort?: string
  _order?: 'asc' | 'desc'
  q?: string
}
