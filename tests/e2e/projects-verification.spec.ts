import { test, expect } from '@playwright/test'

test('should load projects page and create a project', async ({ page }) => {
  // Go to projects page
  await page.goto('/dashboard/projects')

  // Wait for the page to load (checking for the title)
  const heading = page.getByRole('heading', { name: /projects/i })
  await expect(heading).toBeVisible({ timeout: 15000 })

  // Check if the "Create New Project" button is present
  const createButton = page.getByRole('button', { name: /create/i })
  await expect(createButton).toBeVisible()

  // Click the button and check if the form opens
  await createButton.click()
  // The sheet title should be visible
  await expect(page.getByRole('heading', { name: /create/i })).toBeVisible()

  // Fill the form
  const projectName = `E2E Project ${Date.now()}`
  await page.getByLabel(/project name/i).fill(projectName)
  await page.getByLabel(/description/i).fill('Created via automated E2E test')

  // Select priority
  await page.getByLabel(/priority/i).click()
  await page.getByRole('option', { name: /high/i }).click()

  // Select status
  await page.getByLabel(/status/i).click()
  await page.getByRole('option', { name: /active/i }).click()

  // Submit
  const submitButton = page.getByRole('button', { name: /create project/i })
  await submitButton.click()

  // Verify success toast
  await expect(page.getByText(/project created successfully/i)).toBeVisible({ timeout: 10000 })

  // The sheet should close
  await expect(page.getByRole('heading', { name: /create/i })).not.toBeVisible()

  // Verify the new project is in the list
  await expect(page.getByText(projectName)).toBeVisible()
})
