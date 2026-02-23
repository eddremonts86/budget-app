import { test, expect } from '@playwright/test'

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
  })

  test('should display dashboard stats', async ({ page }) => {
    await expect(page.getByText('Total Revenue')).toBeVisible()
    await expect(page.getByText('Active Projects').first()).toBeVisible()
    await expect(page.getByText('Completed Tasks').first()).toBeVisible()
    await expect(page.getByText('Pending Tasks').first()).toBeVisible()
  })

  test('should display upcoming todos', async ({ page }) => {
    // The title might be localized or include "(Next 7 Days)"
    await expect(page.getByText(/Upcoming Tasks/)).toBeVisible()
    // Check if list or empty state is visible
    // Depending on mock data, we might see items
  })

  test('should display workload chart', async ({ page }) => {
    await expect(page.getByText('Team Workload')).toBeVisible()
    // Check for chart container
    await expect(page.locator('.recharts-responsive-container')).toBeVisible()
  })
})
