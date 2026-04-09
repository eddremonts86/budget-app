import { createFileRoute } from '@tanstack/react-router'
import { LandingLayout } from '@/modules/landing'

export const Route = createFileRoute('/_landing')({
  component: LandingLayout,
})
