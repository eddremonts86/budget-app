import { expect, test } from '@playwright/test'

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display the app title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('TanStack Template')
  })

  test('should have working navigation', async ({ page }) => {
    // Click on Todos link
    await page.click('text=Todos')
    await expect(page).toHaveURL('/todos')

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

test.describe('Todos Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/todos')
  })

  test('should display todos list', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Todos')
  })

  test('should open and close create form', async ({ page }) => {
    // Open form
    await page.click('text=Create New Todo')
    await expect(page.locator('form')).toBeVisible()

    // Close form
    await page.click('text=Cancel')
    await expect(page.locator('form')).not.toBeVisible()
  })
})
