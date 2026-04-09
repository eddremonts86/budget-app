import { createFileRoute } from '@tanstack/react-router'
import { HelpChatPage } from '@/modules/ai'

export const Route = createFileRoute('/_dashboard/dashboard/help')({
  component: HelpChatPage,
})
