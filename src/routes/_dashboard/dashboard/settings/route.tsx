import { createFileRoute } from '@tanstack/react-router'
import { SettingsLayout } from '@/modules/settings'

export const Route = createFileRoute('/_dashboard/dashboard/settings')({
  component: SettingsLayout,
})
