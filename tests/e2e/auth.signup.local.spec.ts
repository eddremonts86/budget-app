import { expect, test } from '@playwright/test'
import {
  createAuthCredentials,
  expectDashboard,
  getSessionInBrowser,
  provisionAccount,
  signUpInBrowser,
} from './utils/auth-local'
import { getAppUserByEmail, getAuthUserByEmail } from './utils/auth-local-db'

test.describe.serial('local auth sign up', () => {
  test('creates a local auth user and establishes a browser session', async ({ page }) => {
    const credentials = createAuthCredentials('signup-session')

    await page.goto('/auth')

    const result = await signUpInBrowser(page, credentials)
    expect(result.status).toBe(200)

    const session = await getSessionInBrowser(page)
    expect(session.ok).toBeTruthy()
    expect(session.payload).toMatchObject({
      user: {
        email: credentials.email,
        name: credentials.name,
      },
    })
  })

  test('persists the auth user and syncs the app user after dashboard access', async ({ page }) => {
    const credentials = createAuthCredentials('signup-sync')

    await page.goto('/auth')
    await signUpInBrowser(page, credentials)
    await expectDashboard(page)
    await page.waitForLoadState('networkidle')

    await expect.poll(async () => Boolean(await getAuthUserByEmail(credentials.email))).toBe(true)

    const authUser = await getAuthUserByEmail(credentials.email)
    expect(authUser).toMatchObject({
      email: credentials.email,
      name: credentials.name,
    })

    await expect.poll(async () => Boolean(await getAppUserByEmail(credentials.email))).toBe(true)

    const appUser = await getAppUserByEmail(credentials.email)
    expect(appUser).toMatchObject({
      email: credentials.email,
      name: credentials.name,
      roleId: 'role_user',
    })
  })

  test('rejects duplicate local user creation with the same email', async ({
    playwright,
    baseURL,
  }) => {
    const duplicateCredentials = createAuthCredentials('duplicate-local')

    const firstRequest = await playwright.request.newContext({ baseURL })
    const secondRequest = await playwright.request.newContext({ baseURL })

    const initialCreate = await provisionAccount(firstRequest, duplicateCredentials)
    expect(initialCreate.status()).toBe(200)

    const duplicateCreate = await secondRequest.post('/api/auth/sign-up/email', {
      data: duplicateCredentials,
    })

    expect(duplicateCreate.status()).toBe(422)
    const duplicatePayload = await duplicateCreate.json()
    expect(duplicatePayload).toMatchObject({
      code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL',
    })

    await firstRequest.dispose()
    await secondRequest.dispose()
  })

  test('rejects local user creation without a name', async ({ playwright, baseURL }) => {
    const credentials = createAuthCredentials('missing-name')
    const request = await playwright.request.newContext({ baseURL })

    const response = await request.post('/api/auth/sign-up/email', {
      data: {
        name: '',
        email: credentials.email,
        password: credentials.password,
      },
    })

    expect(response.status()).toBe(422)
    const payload = await response.json()
    expect(payload).toMatchObject({
      code: 'AUTH_NAME_REQUIRED',
    })
    await expect.poll(async () => await getAuthUserByEmail(credentials.email)).toBeNull()
    await expect.poll(async () => await getAppUserByEmail(credentials.email)).toBeNull()
    await request.dispose()
  })

  test('shows a sign-up validation error in the browser before creating the user', async ({
    page,
  }) => {
    const credentials = createAuthCredentials('ui-missing-name')
    let signUpRequestCount = 0

    page.on('request', (request) => {
      if (request.url().endsWith('/api/auth/sign-up/email')) {
        signUpRequestCount += 1
      }
    })

    await page.goto('/auth?tab=sign-up')
    await expect(page.locator('#sign-up-name')).toBeVisible()
    await page.locator('#sign-up-name').fill('   ')
    await page.locator('#sign-up-email').fill(credentials.email)
    await page.locator('#sign-up-password').fill(credentials.password)
    await page.getByTestId('auth-submit-sign-up').click()

    const invalidNameBlocked = await page.locator('#sign-up-name').evaluate((element) => {
      const input = element as HTMLInputElement
      return !input.checkValidity()
    })

    expect(invalidNameBlocked).toBe(true)
    await expect(page).toHaveURL(/\/auth(\?tab=sign-up)?$/)
    await expect.poll(async () => signUpRequestCount).toBe(0)

    const session = await getSessionInBrowser(page)
    expect(
      session.payload === null ||
        (typeof session.payload === 'object' &&
          session.payload !== null &&
          'session' in session.payload &&
          'user' in session.payload &&
          session.payload.session === null &&
          session.payload.user === null),
    ).toBeTruthy()
  })

  test('accepts a non-empty sign-up name with the native browser constraint', async ({ page }) => {
    await page.goto('/auth?tab=sign-up')

    const validNameAccepted = await page.locator('#sign-up-name').evaluate((element) => {
      const input = element as HTMLInputElement
      input.value = 'Ada Lovelace'
      return input.checkValidity()
    })

    expect(validNameAccepted).toBe(true)
  })

  test('rejects local user creation with a weak password', async ({ playwright, baseURL }) => {
    const credentials = createAuthCredentials('weak-password')
    const request = await playwright.request.newContext({ baseURL })

    const response = await request.post('/api/auth/sign-up/email', {
      data: {
        name: credentials.name,
        email: credentials.email,
        password: 'password1',
      },
    })

    expect(response.status()).toBe(422)
    const payload = await response.json()
    expect(payload).toMatchObject({
      code: 'AUTH_PASSWORD_TOO_WEAK',
    })
    await expect.poll(async () => await getAuthUserByEmail(credentials.email)).toBeNull()
    await expect.poll(async () => await getAppUserByEmail(credentials.email)).toBeNull()
    await request.dispose()
  })

  test('blocks weak passwords in the browser before creating the user', async ({ page }) => {
    const credentials = createAuthCredentials('ui-weak-password')
    let signUpRequestCount = 0

    page.on('request', (request) => {
      if (request.url().endsWith('/api/auth/sign-up/email')) {
        signUpRequestCount += 1
      }
    })

    await page.goto('/auth?tab=sign-up')
    await page.locator('#sign-up-name').fill(credentials.name)
    await page.locator('#sign-up-email').fill(credentials.email)
    await page.locator('#sign-up-password').fill('password1')
    await page.getByTestId('auth-submit-sign-up').click()

    const weakPasswordBlocked = await page.locator('#sign-up-password').evaluate((element) => {
      const input = element as HTMLInputElement
      return !input.checkValidity()
    })

    expect(weakPasswordBlocked).toBe(true)
    await expect.poll(async () => signUpRequestCount).toBe(0)
    await expect(page).toHaveURL(/\/auth(\?tab=sign-up)?$/)

    const session = await getSessionInBrowser(page)
    expect(
      session.payload === null ||
        (typeof session.payload === 'object' &&
          session.payload !== null &&
          'session' in session.payload &&
          'user' in session.payload &&
          session.payload.session === null &&
          session.payload.user === null),
    ).toBeTruthy()
  })

  test('shows the duplicate-email error after a progressive sign-up submit', async ({
    page,
    request,
  }) => {
    const credentials = createAuthCredentials('ui-duplicate-email')

    await provisionAccount(request, credentials)

    await page.goto('/auth?tab=sign-up')
    await page.locator('#sign-up-name').fill(credentials.name)
    await page.locator('#sign-up-email').fill(credentials.email)
    await page.locator('#sign-up-password').fill(credentials.password)
    await page.getByTestId('auth-submit-sign-up').click()

    await expect(page).toHaveURL(/\/auth\?tab=sign-up/)
    await expect(page.getByTestId('auth-form-error')).toContainText('User already exists')
  })

  test('marks the sign-up password field invalid with native constraints before submission', async ({
    page,
  }) => {
    await page.goto('/auth?tab=sign-up')

    const isInvalid = await page.locator('#sign-up-password').evaluate((element) => {
      const input = element as HTMLInputElement
      input.value = 'password1'
      return !input.checkValidity()
    })

    expect(isInvalid).toBe(true)
  })

  test('rejects local user creation with an invalid email', async ({ playwright, baseURL }) => {
    const invalidEmail = 'not-an-email'
    const request = await playwright.request.newContext({ baseURL })

    const response = await request.post('/api/auth/sign-up/email', {
      data: {
        name: 'Invalid Email User',
        email: invalidEmail,
        password: 'Passw0rd!234',
      },
    })

    expect(response.ok()).toBe(false)
    expect(response.status()).toBeGreaterThanOrEqual(400)
    await expect.poll(async () => await getAuthUserByEmail(invalidEmail)).toBeNull()
    await request.dispose()
  })

  test('rejects local user creation without a password', async ({ playwright, baseURL }) => {
    const credentials = createAuthCredentials('missing-password')
    const request = await playwright.request.newContext({ baseURL })

    const response = await request.post('/api/auth/sign-up/email', {
      data: {
        name: credentials.name,
        email: credentials.email,
        password: '',
      },
    })

    expect(response.ok()).toBe(false)
    expect(response.status()).toBeGreaterThanOrEqual(400)
    await expect.poll(async () => await getAuthUserByEmail(credentials.email)).toBeNull()
    await expect.poll(async () => await getAppUserByEmail(credentials.email)).toBeNull()
    await request.dispose()
  })

  test('rejects local user creation without an email', async ({ playwright, baseURL }) => {
    const credentials = createAuthCredentials('missing-email')
    const request = await playwright.request.newContext({ baseURL })

    const response = await request.post('/api/auth/sign-up/email', {
      data: {
        name: credentials.name,
        email: '',
        password: credentials.password,
      },
    })

    expect(response.ok()).toBe(false)
    expect(response.status()).toBeGreaterThanOrEqual(400)
    await expect.poll(async () => await getAuthUserByEmail(credentials.email)).toBeNull()
    await expect.poll(async () => await getAppUserByEmail(credentials.email)).toBeNull()
    await request.dispose()
  })
})
