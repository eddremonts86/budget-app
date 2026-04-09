import { createFileRoute } from '@tanstack/react-router'
import { TodosPage } from '@/modules/tasks'

export const Route = createFileRoute('/_dashboard/dashboard/todos')({
  component: TodosPage,
})
