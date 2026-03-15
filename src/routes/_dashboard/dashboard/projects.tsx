import { createFileRoute } from '@tanstack/react-router'
import { ProjectsPage } from '@/features/Projects/components/ProjectsPage'

export const Route = createFileRoute('/_dashboard/dashboard/projects')({
  component: ProjectsPage,
})
