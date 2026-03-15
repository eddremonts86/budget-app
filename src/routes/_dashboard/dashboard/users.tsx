import { createFileRoute } from '@tanstack/react-router'
import { UsersPage } from '@/features/Users/components/UsersPage'

export const Route = createFileRoute('/_dashboard/dashboard/users')({
  component: UsersPage,
})
