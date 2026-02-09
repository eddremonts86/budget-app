import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/features/Home'

export const Route = createFileRoute('/_landing/')({
  component: HomePage,
})
