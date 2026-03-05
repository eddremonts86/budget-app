import { expect, test } from '@playwright/test'

const moduleChecks: Array<{ path: string; selectors: string[] }> = [
  { path: '/dashboard', selectors: ['main', 'h1, h2, button'] },
  { path: '/dashboard/analytics', selectors: ['main', 'button'] },
  { path: '/dashboard/categories', selectors: ['button', 'main'] },
  { path: '/dashboard/help', selectors: ['textarea, input, button', 'main'] },
  { path: '/dashboard/projects', selectors: ['button', 'main'] },
  { path: '/dashboard/settings/system', selectors: ['button', 'main'] },
  { path: '/dashboard/settings/ia_config', selectors: ['[role="tablist"]', 'button'] },
  { path: '/dashboard/team', selectors: ['main', 'button, .card'] },
  { path: '/dashboard/todos', selectors: ['#my-tasks, main', 'button'] },
  { path: '/dashboard/transactions', selectors: ['main', 'button, table, [role="table"]'] },
  { path: '/dashboard/users', selectors: ['button', 'main'] },
]

test.describe('Module critical UI', () => {
  for (const item of moduleChecks) {
    test(`critical UI is present on ${item.path}`, async ({ page }) => {
      await page.goto(item.path)

      for (const selector of item.selectors) {
        await expect(page.locator(selector).first()).toBeVisible({ timeout: 15000 })
      }
    })
  }
})
