import { expect, test } from '@playwright/test'

test.describe('Topbar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should render primary navigation links', async ({ page }) => {
    await expect(page.locator('a[href="#services"]')).toBeVisible()
    await expect(page.locator('a[href="#timeline"]')).toBeVisible()
    await expect(page.locator('a[href="#contact"]')).toBeVisible()
  })

  test('should show theme controls', async ({ page }) => {
    await expect(page.getByLabel('Light theme')).toBeVisible()
    await expect(page.getByLabel('Dark theme')).toBeVisible()
    await expect(page.getByLabel('System theme')).toBeVisible()
  })
})
