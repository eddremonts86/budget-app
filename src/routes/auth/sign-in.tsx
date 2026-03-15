import { createFileRoute } from '@tanstack/react-router'
import {
  buildAuthRedirectPath,
  parseBetterAuthError,
  performBetterAuthJsonRequest,
  redirectWithAuthCookies,
} from '@/shared/lib/auth/form-actions.server'

export const Route = createFileRoute('/auth/sign-in')({
  component: () => null,
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        return redirectWithAuthCookies({
          request,
          to: '/auth',
        })
      },
      POST: async ({ request }: { request: Request }) => {
        const formData = await request.formData()
        const payload = {
          email: String(formData.get('email') ?? ''),
          password: String(formData.get('password') ?? ''),
        }

        const authResponse = await performBetterAuthJsonRequest({
          endpointPath: '/api/auth/sign-in/email',
          payload,
          request,
        })

        if (authResponse.ok) {
          return redirectWithAuthCookies({
            authResponse,
            request,
            to: '/dashboard',
          })
        }

        const authError = await parseBetterAuthError(authResponse)

        return redirectWithAuthCookies({
          request,
          to: buildAuthRedirectPath({
            tab: 'sign-in',
            errorCode: authError.code,
            errorMessage: authError.message,
          }),
        })
      },
    },
  },
})
