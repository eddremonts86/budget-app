import { test, expect } from '@playwright/test'

test('projects page loads', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard/projects')

  // Wait for the page to load
  await page.waitForLoadState('networkidle')

  // Log the body content to help debugging
  const bodyText = await page.evaluate(() => document.body.innerText)
  console.log('Page body text:', bodyText)

  // Check for title - using a more flexible selector
  const title = page.getByText(/Projects/i).first()
  await expect(title).toBeVisible()

  // Check for "Create New Project" button
  const createButton = page.getByRole('button', { name: /create/i }).first()
  await expect(createButton).toBeVisible()

  // Take a screenshot
  await page.screenshot({ path: 'projects-page-debug.png' })
})

test('can create a new project', async ({ page }) => {
  await page.goto('http://localhost:3000/dashboard/projects')
  await page.waitForLoadState('networkidle')

  // Click create button
  await page
    .getByRole('button', { name: /create/i })
    .first()
    .click()

  // Fill the form
  await page.getByLabel(/Name/i).first().fill('E2E Test Project')
  await page
    .getByLabel(/Description/i)
    .first()
    .fill('This is a test project created by Playwright')
  await page
    .getByLabel(/Technologies/i)
    .first()
    .fill('React, Playwright, TypeScript')

  // Submit the form - using type submit which is language agnostic
  await page.locator('button[type="submit"]').click()

  // Verify success (assuming a toast or the project appears in the list)
  // Look for any success message or the project name
  await expect(page.getByText(/success|creado|oprettet/i).first()).toBeVisible()
  await expect(page.getByText('E2E Test Project').first()).toBeVisible()
})
