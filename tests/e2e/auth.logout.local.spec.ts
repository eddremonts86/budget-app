import { expect, test } from '@playwright/test'
import {
  createAuthCredentials,
  expectDashboard,
  provisionAccount,
  signInInBrowser,
  waitForSignedOutSession,
} from './utils/auth-local'

const credentials = createAuthCredentials('logout')

test.describe.serial('local auth sign out', () => {
  test('signs out from the dashboard user menu and returns to public entry', async ({
    page,
    request,
  }) => {
    await provisionAccount(request, credentials)

    await page.goto('/auth')
    await signInInBrowser(page, credentials)
    await expectDashboard(page)

    await page.getByTestId('dashboard-user-menu-trigger').click()
    await page.getByTestId('dashboard-sign-out').click()

    await waitForSignedOutSession(page)
    await page.goto('/', { waitUntil: 'commit' })

    await expect(page.getByTestId('topbar-auth-link')).toBeVisible()
    await expect(page).toHaveURL(/\/$/)
  })
})
