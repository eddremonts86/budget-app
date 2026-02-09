import { createFileRoute } from '@tanstack/react-router'
import { LandingLayout } from '@/shared/layouts/LandingLayout/LandingLayout'

export const Route = createFileRoute('/_landing')({
  component: LandingLayout,
})
