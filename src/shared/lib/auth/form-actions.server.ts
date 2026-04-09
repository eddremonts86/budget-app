import { auth } from './better-auth'

export type AuthFormTab = 'sign-in' | 'sign-up'

interface BetterAuthErrorPayload {
  code?: unknown
  error?: {
    code?: unknown
    message?: unknown
  } | null
  message?: unknown
}

interface PerformBetterAuthRequestOptions {
  endpointPath: '/api/auth/sign-in/email' | '/api/auth/sign-up/email'
  payload: Record<string, unknown>
  request: Request
}

export function buildAuthRedirectPath(options: {
  tab: AuthFormTab
  errorCode?: string
  errorMessage?: string
}) {
  const searchParams = new URLSearchParams()

  if (options.tab === 'sign-up') {
    searchParams.set('tab', 'sign-up')
  }

  if (options.errorCode) {
    searchParams.set('errorCode', options.errorCode)
  }

  if (options.errorMessage) {
    searchParams.set('errorMessage', options.errorMessage)
  }

  const queryString = searchParams.toString()
  return queryString.length > 0 ? `/auth?${queryString}` : '/auth'
}

export async function performBetterAuthJsonRequest({
  endpointPath,
  payload,
  request,
}: PerformBetterAuthRequestOptions) {
  const headers = new Headers(request.headers)
  headers.set('content-type', 'application/json')
  headers.set('accept', 'application/json')

  const authRequest = new Request(new URL(endpointPath, request.url), {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })

  return await auth.handler(authRequest)
}

export async function parseBetterAuthError(response: Response) {
  const rawText = await response
    .clone()
    .text()
    .catch(() => '')

  const payload = (() => {
    try {
      return JSON.parse(rawText) as BetterAuthErrorPayload
    } catch {
      return null
    }
  })()

  const code =
    typeof payload?.code === 'string'
      ? payload.code
      : typeof payload?.error?.code === 'string'
        ? payload.error.code
        : undefined

  const message =
    typeof payload?.message === 'string'
      ? payload.message
      : typeof payload?.error?.message === 'string'
        ? payload.error.message
        : rawText.includes('User already exists. Use another email.')
          ? 'User already exists. Use another email.'
          : rawText.includes('Invalid email or password')
            ? 'Invalid email or password'
            : undefined

  return {
    code,
    message,
  }
}

export function redirectWithAuthCookies(options: {
  authResponse?: Response
  request: Request
  to: string
}) {
  const responseHeaders = new Headers({
    location: new URL(options.to, options.request.url).toString(),
  })

  const authHeaders = options.authResponse?.headers
  const authHeadersWithCookies = authHeaders as Headers & {
    getSetCookie?: () => string[]
  }

  const setCookies = authHeadersWithCookies?.getSetCookie?.() ?? []

  if (setCookies.length > 0) {
    for (const setCookie of setCookies) {
      responseHeaders.append('set-cookie', setCookie)
    }
  } else {
    const setCookie = authHeaders?.get('set-cookie')

    if (setCookie) {
      responseHeaders.append('set-cookie', setCookie)
    }
  }

  return new Response(null, {
    status: 303,
    headers: responseHeaders,
  })
}
