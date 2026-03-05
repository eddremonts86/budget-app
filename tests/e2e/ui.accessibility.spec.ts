import { expect, test } from '@playwright/test'

test.describe('Basic accessibility', () => {
  test('has semantic content and keyboard-focusable controls', async ({ page }) => {
    await page.goto('/dashboard')

    await expect(page.locator('h1, h2, [role="main"], main').first()).toBeVisible()

    await page.keyboard.press('Tab')

    const activeTagName = await page.evaluate(() => document.activeElement?.tagName ?? '')
    expect(['A', 'BUTTON', 'INPUT', 'TEXTAREA', 'SELECT']).toContain(activeTagName)
  })
})
