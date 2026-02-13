import { expect, test } from '@playwright/test'
import { applyLanguage, getByRoleI18n, getByPlaceholderI18n } from './utils/i18n'

test.describe('Categories, Projects & Team', () => {
  test('should display categories and allow creation', async ({ page }, testInfo) => {
    await applyLanguage(page, testInfo)
    await page.goto('/dashboard/categories')
    await expect(await getByRoleI18n(page, 'heading', 'categories.title')).toBeVisible()

    await (await getByRoleI18n(page, 'button', 'categories.add')).click()
    const catName = `Cat ${Date.now()}`
    await (await getByPlaceholderI18n(page, 'categories.namePlaceholder')).fill(catName)
    await (await getByRoleI18n(page, 'button', 'categories.save')).click()

    await expect(page.locator(`text=${catName}`)).toBeVisible()
  })

  test('should display projects page', async ({ page }, testInfo) => {
    await applyLanguage(page, testInfo)
    await page.goto('/dashboard/projects')
    await expect(await getByRoleI18n(page, 'heading', 'projects.title')).toBeVisible()
    await expect(page.locator('table')).toBeVisible()
  })

  test('should display team page', async ({ page }, testInfo) => {
    await applyLanguage(page, testInfo)
    await page.goto('/dashboard/team')
    await expect(await getByRoleI18n(page, 'heading', 'team.title')).toBeVisible()
    // Verificar que hay miembros del equipo
    const membersCount = await page.locator('.grid > div').count()
    expect(membersCount).toBeGreaterThan(0)
  })
})
