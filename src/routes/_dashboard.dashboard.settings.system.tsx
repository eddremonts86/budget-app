import { createFileRoute } from '@tanstack/react-router'
import { SystemSettings } from '@/features/Settings/ui/SystemSettings'

export const Route = createFileRoute('/_dashboard/dashboard/settings/system')({
  component: SystemSettings,
})
