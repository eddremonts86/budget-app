import { createFileRoute } from '@tanstack/react-router'
import { handleChatPost } from './route'

export const Route = createFileRoute('/api/ai/chat/completions')({
  component: () => null,
  server: {
    handlers: {
      POST: handleChatPost,
    },
  },
})
