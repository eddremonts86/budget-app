import { createFileRoute } from '@tanstack/react-router'
import { UsersPage } from '@/modules/users'

export const Route = createFileRoute('/_dashboard/dashboard/users')({
  component: UsersPage,
})
