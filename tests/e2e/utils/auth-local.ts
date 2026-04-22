import { expect, type APIRequestContext, type Page } from '@playwright/test'

export interface AuthCredentials {
  name: string
  email: string
  password: string
}

export function createAuthCredentials(prefix: string): AuthCredentials {
  return {
    name: `Auth Local ${prefix}`,
    email: `${prefix.toLowerCase()}-${Date.now()}@example.com`,
    password: 'Passw0rd!234',
  }
}

export async function provisionAccount(request: APIRequestContext, credentials: AuthCredentials) {
  const response = await request.post('/api/auth/sign-up/email', { data: credentials })
  expect(response.ok()).toBeTruthy()
  return response
}

export async function signUpInBrowser(page: Page, credentials: AuthCredentials) {
  const result = await page.evaluate(async (activeCredentials) => {
    const response = await fetch('/api/auth/sign-up/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activeCredentials),
    })

    let payload: unknown

    try {
      payload = await response.json()
    } catch {
      payload = null
    }

    return {
      ok: response.ok,
      status: response.status,
      payload,
    }
  }, credentials)

  expect(result.ok, JSON.stringify(result.payload)).toBeTruthy()
  return result
}

export async function signInInBrowser(page: Page, credentials: AuthCredentials) {
  const result = await page.evaluate(async (activeCredentials) => {
    const response = await fetch('/api/auth/sign-in/email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activeCredentials),
    })

    let payload: unknown

    try {
      payload = await response.json()
    } catch {
      payload = null
    }

    return {
      ok: response.ok,
      status: response.status,
      payload,
    }
  }, credentials)

  expect(result.ok, JSON.stringify(result.payload)).toBeTruthy()

  const session = await page.evaluate(async () => {
    const response = await fetch('/api/auth/get-session')

    let payload: unknown

    try {
      payload = await response.json()
    } catch {
      payload = null
    }

    return {
      ok: response.ok,
      status: response.status,
      payload,
    }
  })

  expect(session.ok, JSON.stringify(session.payload)).toBeTruthy()
}

export async function getSessionInBrowser(page: Page) {
  return await page.evaluate(async () => {
    const response = await fetch('/api/auth/get-session')

    let payload: unknown

    try {
      payload = await response.json()
    } catch {
      payload = null
    }

    return {
      ok: response.ok,
      status: response.status,
      payload,
    }
  })
}

export async function expectDashboard(page: Page) {
  const response = await page.goto('/dashboard', { waitUntil: 'commit' })

  expect(response?.ok()).toBeTruthy()
  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByTestId('dashboard-shell')).toBeVisible()
  await expect(page.getByTestId('dashboard-user-menu-trigger')).toBeVisible()
}

export async function waitForSignedOutSession(page: Page) {
  await page.waitForFunction(async () => {
    try {
      const response = await fetch('/api/auth/get-session')

      if (!response.ok) {
        return false
      }

      const payload = await response.json()
      return !payload?.session && !payload?.user
    } catch {
      return false
    }
  })
}
