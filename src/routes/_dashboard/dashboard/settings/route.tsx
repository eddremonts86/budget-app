import { createFileRoute } from '@tanstack/react-router'
import { SettingsLayout } from '@/features/Settings/ui/SettingsLayout'

export const Route = createFileRoute('/_dashboard/dashboard/settings')({
  component: SettingsLayout,
})
