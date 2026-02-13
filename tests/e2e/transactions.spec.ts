import { expect, test } from '@playwright/test'
import { applyLanguage, getByRoleI18n, getByPlaceholderI18n, getByTextI18n } from './utils/i18n'

test.describe('Transactions Flow', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await applyLanguage(page, testInfo)
    await page.goto('/dashboard/transactions')
  })

  test('should create a new transaction', async ({ page }) => {
    const amount = '150.50'
    const customerName = `Customer ${Date.now()}`
    const customerEmail = `customer-${Date.now()}@example.com`

    await (await getByRoleI18n(page, 'button', 'transactions.actions.add')).click()

    await (
      await getByPlaceholderI18n(page, 'transactions.form.customerNamePlaceholder')
    ).fill(customerName)
    await (
      await getByPlaceholderI18n(page, 'transactions.form.customerEmailPlaceholder')
    ).fill(customerEmail)

    // Seleccionar estado
    await page.getByRole('combobox').click()
    await (await getByRoleI18n(page, 'option', 'transactions.status.approved')).click()

    await (await getByPlaceholderI18n(page, 'transactions.form.amountPlaceholder')).fill(amount)

    await (await getByRoleI18n(page, 'button', 'transactions.actions.save')).click()

    await expect(page.locator(`text=${customerName}`)).toBeVisible()
    await expect(page.locator(`text=${customerEmail}`)).toBeVisible()
    await expect(await getByTextI18n(page, 'transactions.toast.created')).toBeVisible()
  })

  test('should edit a transaction', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first()
    await firstRow.locator('button').last().click()
    await (await getByRoleI18n(page, 'menuitem', 'transactions.actions.edit')).click()

    const updatedName = `Updated Customer ${Date.now()}`
    await (
      await getByPlaceholderI18n(page, 'transactions.form.customerNamePlaceholder')
    ).fill(updatedName)
    await (await getByRoleI18n(page, 'button', 'transactions.actions.save')).click()

    await expect(page.locator(`text=${updatedName}`)).toBeVisible()
    await expect(await getByTextI18n(page, 'transactions.toast.updated')).toBeVisible()
  })

  test('should delete a transaction', async ({ page }) => {
    const firstRow = page.locator('table tbody tr').first()

    await firstRow.locator('button').last().click()
    await (await getByRoleI18n(page, 'menuitem', 'transactions.actions.delete')).click()

    await expect(await getByTextI18n(page, 'transactions.confirm.delete')).toBeVisible()
    await (await getByRoleI18n(page, 'button', 'common.delete')).click()

    await expect(await getByTextI18n(page, 'transactions.toast.deleted')).toBeVisible()
  })
})
