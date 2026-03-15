import { createFileRoute } from '@tanstack/react-router'
import {
  buildAuthRedirectPath,
  parseBetterAuthError,
  performBetterAuthJsonRequest,
  redirectWithAuthCookies,
} from '@/shared/lib/auth/form-actions.server'
import { validateSignUpPayload } from '@/shared/lib/auth/sign-up-validation'

export const Route = createFileRoute('/auth/sign-up')({
  component: () => null,
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        return redirectWithAuthCookies({
          request,
          to: '/auth?tab=sign-up',
        })
      },
      POST: async ({ request }: { request: Request }) => {
        const formData = await request.formData()
        const payload = {
          name: String(formData.get('name') ?? ''),
          email: String(formData.get('email') ?? ''),
          password: String(formData.get('password') ?? ''),
        }

        const validationErrorCode = validateSignUpPayload(payload)

        if (validationErrorCode) {
          return redirectWithAuthCookies({
            request,
            to: buildAuthRedirectPath({
              tab: 'sign-up',
              errorCode: validationErrorCode,
            }),
          })
        }

        const authResponse = await performBetterAuthJsonRequest({
          endpointPath: '/api/auth/sign-up/email',
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
            tab: 'sign-up',
            errorCode: authError.code,
            errorMessage: authError.message,
          }),
        })
      },
    },
  },
})
