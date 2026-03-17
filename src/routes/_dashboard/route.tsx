import { createFileRoute, redirect } from '@tanstack/react-router'
import { DashboardLayout } from '@/modules/dashboard'
import { ensureAppAuthSession } from '@/shared/lib/auth/app-auth.functions'

export const Route = createFileRoute('/_dashboard')({
  beforeLoad: async () => {
    try {
      await ensureAppAuthSession()
    } catch {
      throw redirect({
        to: '/auth',
      })
    }
  },
  component: DashboardLayout,
})
