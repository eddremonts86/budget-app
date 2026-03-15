import { createFileRoute, redirect } from '@tanstack/react-router'
import { DashboardLayout } from '@/shared/layouts/DashboardLayout/DashboardLayout'
import { ensureAppAuthSession } from '@/shared/lib/auth/app-auth.functions'
import { isBetterAuthEnabled } from '@/shared/lib/auth/config'

export const Route = createFileRoute('/_dashboard')({
  beforeLoad: async () => {
    try {
      await ensureAppAuthSession()
    } catch {
      throw redirect({
        to: isBetterAuthEnabled() ? '/auth' : '/',
      })
    }
  },
  component: DashboardLayout,
})
