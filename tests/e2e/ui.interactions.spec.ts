import { expect, test } from '@playwright/test'

test.describe('UI interactions', () => {
  test('supports basic navigation and interactive controls', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page.locator('main, [role="main"]').first()).toBeVisible()

    const interactive = page.locator('button:visible, a[href]:visible').first()
    await expect(interactive).toBeVisible()
    await interactive.click()

    await expect(page).toHaveURL(/\/dashboard|\/$/)
  })

  test('allows typing in searchable/chat-like input on help module', async ({ page }) => {
    await page.goto('/dashboard/help')

    const editable = page.locator('textarea, input[type="text"], input[placeholder]').first()
    await expect(editable).toBeVisible()

    await editable.fill('Playwright interaction test message')
    await expect(editable).toHaveValue(/Playwright interaction test message/)
  })

  test('renders not found state for invalid route', async ({ page }) => {
    const response = await page.goto('/dashboard/route-does-not-exist')
    expect(response?.status()).toBe(404)
    await expect(page.locator('body')).toBeVisible()
  })
})
