import { expect, test } from '@playwright/test'
import { applyLanguage, getByLabelI18n, getByRoleI18n, getByTextI18n } from './utils/i18n'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await applyLanguage(page, testInfo)
    await page.goto('/')
  })

  test('should display the app title', async ({ page }) => {
    await expect(await getByTextI18n(page, 'app.name')).toBeVisible()
  })

  test('should have working navigation', async ({ page }) => {
    // Click back to home
    await (await getByRoleI18n(page, 'link', 'nav.home')).click()
    await expect(page).toHaveURL('/')
  })

  test('should toggle theme', async ({ page }) => {
    const html = page.locator('html')
    const isMobile = await page.evaluate(() => window.innerWidth < 768)
    if (isMobile) {
      await (await getByRoleI18n(page, 'button', 'common.openMenu', { timeout: 2000 })).click()
    }
    const darkToggle = await getByLabelI18n(page, 'themeToggle.dark', { timeout: 3000 })
    await darkToggle.click()
    await expect(html).toHaveClass(/dark/)
    await (await getByLabelI18n(page, 'themeToggle.light')).click()
    await expect(html).not.toHaveClass(/dark/)
  })
})
