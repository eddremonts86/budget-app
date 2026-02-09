import { createFileRoute } from '@tanstack/react-router'
import { TodosPage } from '@/features/Todos/components/TodosPage'

export const Route = createFileRoute('/_dashboard/dashboard/todos')({
  component: TodosPage,
})
