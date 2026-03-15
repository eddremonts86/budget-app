import { createFileRoute } from '@tanstack/react-router'
import { TeamPage } from '@/features/Team/components/TeamPage'

export const Route = createFileRoute('/_dashboard/dashboard/team')({
  component: TeamPage,
})
