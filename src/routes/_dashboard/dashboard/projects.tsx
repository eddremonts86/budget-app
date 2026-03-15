import { createFileRoute } from '@tanstack/react-router'
import { ProjectsPage } from '@/modules/projects'

export const Route = createFileRoute('/_dashboard/dashboard/projects')({
  component: ProjectsPage,
})
