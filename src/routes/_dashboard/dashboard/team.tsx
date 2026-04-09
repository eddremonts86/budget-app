import { createFileRoute } from '@tanstack/react-router'
import { TeamPage } from '@/modules/team'

export const Route = createFileRoute('/_dashboard/dashboard/team')({
  component: TeamPage,
})
