import { createFileRoute } from '@tanstack/react-router'
import {
  createSignUpValidationErrorResponse,
  validateSignUpPayload,
} from '@/shared/lib/auth/sign-up-validation'

export const Route = createFileRoute('/api/auth/$')({
  component: () => null,
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const { auth } = await import('@/shared/lib/auth/better-auth')
        return await auth.handler(request)
      },
      POST: async ({ request }: { request: Request }) => {
        const pathname = new URL(request.url).pathname

        if (pathname.endsWith('/sign-up/email')) {
          const payload = await request
            .clone()
            .json()
            .catch(() => ({}))

          const validationErrorCode = validateSignUpPayload(payload)

          if (validationErrorCode) {
            return createSignUpValidationErrorResponse(validationErrorCode)
          }
        }

        const { auth } = await import('@/shared/lib/auth/better-auth')
        return await auth.handler(request)
      },
    },
  },
})
