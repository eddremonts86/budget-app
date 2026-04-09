import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthPage } from '@/modules/auth'
import { getAppAuthSession } from '@/shared/lib/auth/app-auth.functions'

export const Route = createFileRoute('/auth')({
  beforeLoad: async () => {
    const session = await getAppAuthSession()

    if (session.userId) {
      throw redirect({
        to: '/dashboard',
      })
    }
  },
  component: AuthPage,
})
