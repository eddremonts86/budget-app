import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/modules/landing'

export const Route = createFileRoute('/_landing/')({
  component: HomePage,
})
