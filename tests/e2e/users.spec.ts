import { expect, test } from '@playwright/test'
import { applyLanguage, getByRoleI18n, getByPlaceholderI18n, getByTextI18n } from './utils/i18n'

test.describe('Users Flow', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await applyLanguage(page, testInfo)
    await page.goto('/dashboard/users')
  })

  test('should create a new user', async ({ page }) => {
    const userName = `Test User ${Date.now()}`
    const userEmail = `test-${Date.now()}@example.com`

    await (await getByRoleI18n(page, 'button', 'users.actions.new')).click()

    await (await getByPlaceholderI18n(page, 'users.form.namePlaceholder')).fill(userName)
    await (await getByPlaceholderI18n(page, 'users.form.emailPlaceholder')).fill(userEmail)

    // Seleccionar rol
    await page.getByRole('combobox').click()
    await (await getByRoleI18n(page, 'option', 'users.form.roleAdmin')).click()

    await (await getByRoleI18n(page, 'button', 'users.actions.save')).click()

    await expect(page.locator(`text=${userName}`)).toBeVisible()
    await expect(page.locator(`text=${userEmail}`)).toBeVisible()
    await expect(await getByTextI18n(page, 'users.toast.created')).toBeVisible()
  })

  test('should edit a user', async ({ page }) => {
    const firstUserRow = page.locator('table tbody tr').first()
    await firstUserRow.locator('button').last().click()
    await (await getByRoleI18n(page, 'menuitem', 'users.actions.editProfile')).click()

    const updatedName = `Updated User ${Date.now()}`
    await (await getByPlaceholderI18n(page, 'users.form.namePlaceholder')).fill(updatedName)
    await (await getByRoleI18n(page, 'button', 'users.actions.save')).click()

    await expect(page.locator(`text=${updatedName}`)).toBeVisible()
    await expect(await getByTextI18n(page, 'users.toast.updated')).toBeVisible()
  })

  test('should delete a user', async ({ page }) => {
    const firstUserRow = page.locator('table tbody tr').first()
    const userName = await firstUserRow.locator('td').first().innerText()

    await firstUserRow.locator('button').last().click()
    await (await getByRoleI18n(page, 'menuitem', 'users.actions.deleteAccount')).click()

    await expect(await getByTextI18n(page, 'users.confirm.delete')).toBeVisible()
    await (await getByRoleI18n(page, 'button', 'common.delete')).click()

    await expect(await getByTextI18n(page, 'users.toast.deleted')).toBeVisible()
    await expect(page.locator(`text=${userName}`)).not.toBeVisible()
  })
})
