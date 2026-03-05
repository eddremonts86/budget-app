import { expect, test } from '@playwright/test'

const viewports = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'mobile', width: 390, height: 844 },
]

test.describe('Responsive behavior', () => {
  for (const viewport of viewports) {
    test(`dashboard renders on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.goto('/dashboard')

      await expect(page.locator('h1, h2, [role="main"], main').first()).toBeVisible()

      const hasSevereOverflow = await page.evaluate(() => {
        const html = document.documentElement
        return html.scrollWidth > html.clientWidth * 1.35
      })

      expect(hasSevereOverflow).toBeFalsy()
    })
  }
})
