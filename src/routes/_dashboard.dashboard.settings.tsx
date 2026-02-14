import { createFileRoute } from '@tanstack/react-router'
import { SettingsPage } from '@/features/Settings'

export const Route = createFileRoute('/_dashboard/dashboard/settings')({
  component: SettingsPage,
})
