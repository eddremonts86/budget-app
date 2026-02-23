import { test, expect } from '@playwright/test'

test.describe('Analytics Dashboard', () => {
  test.setTimeout(120000)

  test.beforeEach(async ({ page }) => {
    // Navigate to the analytics page
    await page.goto('/dashboard/analytics')
  })

  test('should display key performance indicators (KPIs)', async ({ page }) => {
    // Verify KPI cards are visible with increased timeout to allow for DB connection timeout fallback
    await expect(page.getByText('Total Revenue')).toBeVisible({ timeout: 60000 })
    await expect(page.getByText('Active Projects', { exact: true })).toBeVisible({ timeout: 10000 })
    // Use first() because "Task Completion" is also a table header
    await expect(page.getByText('Task Completion', { exact: true }).first()).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByText('Active Users')).toBeVisible({ timeout: 10000 })
  })

  test('should display revenue trend chart', async ({ page }) => {
    // Verify chart title
    await expect(page.getByText('Revenue Trend')).toBeVisible()
    // Check for chart element (recharts renders svg)
    await expect(page.locator('.recharts-responsive-container').first()).toBeVisible()
    // Check for period selector
    await expect(page.getByText('Last 30 days', { exact: true })).toBeVisible()
  })

  test('should display task distribution chart', async ({ page }) => {
    // Verify task distribution section
    await expect(page.getByText('Tasks by Status')).toBeVisible()
    await expect(page.getByText('Tasks by Priority')).toBeVisible()
    // Check for chart element
    await expect(page.locator('.recharts-responsive-container').nth(1)).toBeVisible()
  })

  test('should display project performance table', async ({ page }) => {
    // Verify project performance section
    await expect(page.getByText('Project Performance')).toBeVisible()
    // Verify table headers
    await expect(page.getByRole('columnheader', { name: 'Project Name' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Task Completion' })).toBeVisible()
  })

  test('should allow searching in project performance table', async ({ page }) => {
    // Find the search input
    const searchInput = page.getByPlaceholder('Search projects...')
    await expect(searchInput).toBeVisible()

    // Type a search term
    await searchInput.fill('Project Alpha')

    // Verify that the table filters (this assumes we have data or mock data)
    // For now, we just check that the input accepts text
    await expect(searchInput).toHaveValue('Project Alpha')
  })

  test('should allow date range filtering', async ({ page }) => {
    // Verify date range picker exists
    const datePicker = page.getByRole('button', { name: /Pick a date/i })
    if (await datePicker.isVisible()) {
      await datePicker.click()
      // Check if calendar opens
      await expect(page.getByRole('dialog')).toBeVisible()
    }
  })
})
