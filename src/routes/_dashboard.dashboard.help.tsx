import { createFileRoute } from '@tanstack/react-router'
import { HelpChatPage } from '@/features/Ai/components/HelpChatPage'

export const Route = createFileRoute('/_dashboard/dashboard/help')({
  component: HelpChatPage,
})
