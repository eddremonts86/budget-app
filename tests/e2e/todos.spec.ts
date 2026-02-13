import { expect, test } from '@playwright/test'
import { applyLanguage, getByRoleI18n, getByLabelI18n, getByTextI18n } from './utils/i18n'

test.describe('Todos Flow', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await applyLanguage(page, testInfo)
    await page.goto('/dashboard/todos')
  })

  test('should create a new todo', async ({ page }) => {
    const todoTitle = `Test Todo ${Date.now()}`

    // Abrir formulario de creación
    await (await getByRoleI18n(page, 'button', 'todos.actions.new')).click()

    // Rellenar formulario
    await (await getByLabelI18n(page, 'todos.form.titleLabel')).fill(todoTitle)
    await (
      await getByLabelI18n(page, 'todos.form.descriptionLabel')
    ).fill('Esta es una tarea de prueba creada por E2E')

    // Seleccionar prioridad (por defecto es Media, cambiamos a Alta)
    await page.getByRole('combobox').nth(1).click()
    await (await getByRoleI18n(page, 'option', 'todos.form.priorityHigh')).click()

    // Guardar
    await (await getByRoleI18n(page, 'button', 'todos.actions.create')).click()

    // Verificar que aparece en la lista
    await expect(page.locator(`text=${todoTitle}`)).toBeVisible()
    await expect(await getByTextI18n(page, 'todos.toast.created')).toBeVisible()
  })

  test('should edit a todo', async ({ page }) => {
    // Buscar la primera tarea y editarla
    const firstTodoRow = page.locator('table tbody tr').first()
    await firstTodoRow.locator('button').last().click() // Abrir menú de acciones
    await (await getByRoleI18n(page, 'menuitem', 'todos.actions.edit')).click()

    const updatedTitle = `Updated Todo ${Date.now()}`
    await (await getByLabelI18n(page, 'todos.form.titleLabel')).fill(updatedTitle)
    await (await getByRoleI18n(page, 'button', 'todos.actions.update')).click()

    await expect(page.locator(`text=${updatedTitle}`)).toBeVisible()
    await expect(await getByTextI18n(page, 'todos.toast.updated')).toBeVisible()
  })

  test('should delete a todo', async ({ page }) => {
    const firstTodoRow = page.locator('table tbody tr').first()
    const todoTitle = await firstTodoRow.locator('td').first().innerText()

    await firstTodoRow.locator('button').last().click()
    await (await getByRoleI18n(page, 'menuitem', 'todos.actions.delete')).click()

    // Confirmar en el toast/dialog
    await expect(await getByTextI18n(page, 'todos.confirm.delete')).toBeVisible()
    await (await getByRoleI18n(page, 'button', 'common.delete')).click()

    await expect(await getByTextI18n(page, 'todos.toast.deleted')).toBeVisible()
    await expect(page.locator(`text=${todoTitle}`)).not.toBeVisible()
  })

  test('should filter by status/priority (if UI exists)', async () => {
    // Aquí podríamos añadir tests de filtrado si estuvieran implementados en la UI
  })
})
