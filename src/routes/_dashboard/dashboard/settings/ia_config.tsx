import { createFileRoute } from '@tanstack/react-router'
import { AiConfigForm } from '@/features/Settings/ui/AiConfigForm'

export const Route = createFileRoute('/_dashboard/dashboard/settings/ia_config')({
  component: AiConfigForm,
})
