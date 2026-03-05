import { expect, test } from '@playwright/test'

test.describe('Loading and error states', () => {
  test('shows loading indicator while data is delayed', async ({ page }) => {
    await page.route('**/*', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 150))
      await route.continue()
    })

    await page.goto('/dashboard/projects', { waitUntil: 'domcontentloaded' })
    await expect(page.locator('.animate-spin').first()).toBeVisible({ timeout: 15000 })
  })

  test('shows not-found error state for invalid path', async ({ page }) => {
    const response = await page.goto('/dashboard/_invalid_route_for_error_state_')
    expect(response?.status()).toBe(404)
    await expect(page.locator('body')).toBeVisible()
  })

  test('returns expected API error payload for invalid test-connection body', async ({
    request,
  }) => {
    const response = await request.post('/api/ai/test-connection', {
      data: {},
    })

    expect(response.status()).toBe(400)

    const json = (await response.json()) as { error?: string }
    expect(json.error).toBeTruthy()
  })
})
