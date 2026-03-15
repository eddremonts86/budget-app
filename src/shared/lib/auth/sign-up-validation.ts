export type SignUpValidationErrorCode = 'AUTH_NAME_REQUIRED' | 'AUTH_PASSWORD_TOO_WEAK'

export const AUTH_SIGN_UP_MIN_PASSWORD_LENGTH = 8
export const AUTH_SIGN_UP_NAME_HTML_PATTERN = '.*[^ ].*'
export const AUTH_SIGN_UP_PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d\s]).+$/
export const AUTH_SIGN_UP_PASSWORD_HTML_PATTERN = '(?=.*[A-Za-z])(?=.*\\d)(?=.*[^A-Za-z\\d\\s]).+'

interface SignUpPayloadLike {
  name?: unknown
  password?: unknown
}

export function validateSignUpPayload(
  payload: SignUpPayloadLike,
): SignUpValidationErrorCode | null {
  const normalizedName = typeof payload.name === 'string' ? payload.name.trim() : ''

  if (normalizedName.length === 0) {
    return 'AUTH_NAME_REQUIRED'
  }

  const normalizedPassword = typeof payload.password === 'string' ? payload.password : ''
  const hasMinimumLength = normalizedPassword.length >= AUTH_SIGN_UP_MIN_PASSWORD_LENGTH
  const matchesPasswordPattern = AUTH_SIGN_UP_PASSWORD_PATTERN.test(normalizedPassword)

  if (!hasMinimumLength || !matchesPasswordPattern) {
    return 'AUTH_PASSWORD_TOO_WEAK'
  }

  return null
}

export function getSignUpValidationErrorMessage(code: SignUpValidationErrorCode): string {
  switch (code) {
    case 'AUTH_NAME_REQUIRED':
      return 'Enter your full name to create an account.'
    case 'AUTH_PASSWORD_TOO_WEAK':
      return 'Use at least 8 characters with letters, numbers, and a symbol.'
  }
}

export function createSignUpValidationErrorResponse(code: SignUpValidationErrorCode): Response {
  return Response.json(
    {
      code,
      message: getSignUpValidationErrorMessage(code),
    },
    { status: 422 },
  )
}
