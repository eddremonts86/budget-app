import { createFileRoute } from '@tanstack/react-router'
import { auth } from '@/shared/lib/auth/better-auth'

export const Route = createFileRoute('/api/auth/$')({
  component: () => null,
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        return await auth.handler(request)
      },
      POST: async ({ request }: { request: Request }) => {
        return await auth.handler(request)
      },
    },
  },
})
