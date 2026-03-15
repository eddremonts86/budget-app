import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/auth/$')({
  component: () => null,
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const { auth } = await import('@/shared/lib/auth/better-auth')
        return await auth.handler(request)
      },
      POST: async ({ request }: { request: Request }) => {
        const { auth } = await import('@/shared/lib/auth/better-auth')
        return await auth.handler(request)
      },
    },
  },
})
