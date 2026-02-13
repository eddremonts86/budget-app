import { expect, test } from '@playwright/test'
import { applyLanguage, getByLabelI18n } from './utils/i18n'

test.describe('Topbar', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await applyLanguage(page, testInfo)
    await page.goto('/')
  })

  test('should render primary navigation links', async ({ page }) => {
    await expect(page.locator('a[href="#services"]')).toBeVisible()
    await expect(page.locator('a[href="#timeline"]')).toBeVisible()
    await expect(page.locator('a[href="#contact"]')).toBeVisible()
  })

  test('should show theme controls', async ({ page }) => {
    await expect(await getByLabelI18n(page, 'themeToggle.light')).toBeVisible()
    await expect(await getByLabelI18n(page, 'themeToggle.dark')).toBeVisible()
    await expect(await getByLabelI18n(page, 'themeToggle.system')).toBeVisible()
  })
})
