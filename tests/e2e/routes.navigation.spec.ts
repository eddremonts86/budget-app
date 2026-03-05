import { expect, test } from '@playwright/test'
import { uiRoutes } from './route-inventory'

test.describe('Route navigation', () => {
  for (const route of uiRoutes) {
    test(`navigates ${route.path}`, async ({ page }) => {
      const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' })

      expect(response, `No response for ${route.path}`).not.toBeNull()
      expect(response!.status(), `Unexpected status for ${route.path}`).toBeLessThan(500)

      if (route.redirectTo) {
        await expect(page).toHaveURL(new RegExp(`${route.redirectTo}$`))
      } else {
        await expect(page).toHaveURL(
          new RegExp(`${route.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
        )
      }

      await expect(page.locator('h1, h2, [role="main"], main').first()).toBeVisible()
    })
  }
})
