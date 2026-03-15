import { createFileRoute } from '@tanstack/react-router'
import { AiConfigForm } from '@/modules/settings'

export const Route = createFileRoute('/_dashboard/dashboard/settings/ia_config')({
  component: AiConfigForm,
})
