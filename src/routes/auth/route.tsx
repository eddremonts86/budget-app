import { createFileRoute } from '@tanstack/react-router'
import { AuthPage } from '@/modules/auth'

export const Route = createFileRoute('/auth')({
  component: AuthPage,
})
