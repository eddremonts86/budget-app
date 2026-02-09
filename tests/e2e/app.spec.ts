import { expect, test } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display the app title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('TanStack Template')
  })

  test('should have working navigation', async ({ page }) => {
    // Click back to home
    await page.click('text=Home')
    await expect(page).toHaveURL('/')
  })

  test('should toggle theme', async ({ page }) => {
    const html = page.locator('html')

    // Click dark theme button
    await page.getByLabel('Dark theme').click()
    await expect(html).toHaveClass(/dark/)

    // Click light theme button
    await page.getByLabel('Light theme').click()
    await expect(html).not.toHaveClass(/dark/)
  })
})
