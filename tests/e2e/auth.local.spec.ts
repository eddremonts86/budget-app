import { expect, test } from '@playwright/test'
import {
  createAuthCredentials,
  expectDashboard,
  provisionAccount,
  signInInBrowser,
} from './utils/auth-local'

const credentials = createAuthCredentials('login')

test.describe.serial('local auth journey', () => {
  test('starts on landing and exposes the auth entrypoint', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByTestId('topbar-auth-link')).toBeVisible()

    await page.getByTestId('topbar-auth-link').click()

    await expect(page).toHaveURL(/\/auth$/)
    await expect(page.getByTestId('auth-tab-sign-in')).toBeVisible()
    await expect(page.getByTestId('auth-tab-sign-up')).toBeVisible()
  })

  test('switches from sign-in to sign-up and reveals the registration form', async ({ page }) => {
    await page.goto('/auth')

    await page.getByTestId('auth-tab-sign-up').click()

    await expect(page.locator('#sign-up-name')).toBeVisible()
    await expect(page.locator('#sign-up-email')).toBeVisible()
    await expect(page.locator('#sign-up-password')).toBeVisible()
  })

  test('signs in locally from the landing entry and reaches the dashboard', async ({
    page,
    request,
  }) => {
    await provisionAccount(request, credentials)

    await page.goto('/')
    await page.getByTestId('topbar-auth-link').click()
    await expect(page).toHaveURL(/\/auth$/)
    await page.getByTestId('auth-input-sign-in-email').fill(credentials.email)
    await page.getByTestId('auth-input-sign-in-password').fill(credentials.password)
    await page.getByTestId('auth-submit-sign-in').click()
    await expectDashboard(page)
  })

  test('redirects authenticated users away from /auth', async ({ page, request }) => {
    const redirectCredentials = createAuthCredentials('redirect')

    await provisionAccount(request, redirectCredentials)

    await page.goto('/auth')
    await signInInBrowser(page, redirectCredentials)
    await expectDashboard(page)

    await page.goto('/auth')

    await expect(page).toHaveURL(/\/dashboard$/)
  })
})
