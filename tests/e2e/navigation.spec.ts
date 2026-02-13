import { expect, test } from '@playwright/test'
import { applyLanguage, getByRoleI18n } from './utils/i18n'

test.describe('Global Navigation', () => {
  test('should navigate through all main dashboard pages via sidebar', async ({
    page,
  }, testInfo) => {
    await applyLanguage(page, testInfo)
    await page.goto('/dashboard')

    const navItems = [
      { key: 'sidebar.main.dashboard', url: '/dashboard' },
      { key: 'sidebar.main.analytics', url: '/dashboard/analytics' },
      { key: 'sidebar.main.todos', url: '/dashboard/todos' },
      { key: 'sidebar.main.users', url: '/dashboard/users' },
      { key: 'sidebar.main.transactions', url: '/dashboard/transactions' },
      { key: 'sidebar.main.categories', url: '/dashboard/categories' },
      { key: 'sidebar.main.projects', url: '/dashboard/projects' },
      { key: 'sidebar.main.team', url: '/dashboard/team' },
    ]

    for (const item of navItems) {
      // Usamos getByRole para ser más robustos, o getByText si es un link simple
      await (await getByRoleI18n(page, 'link', item.key, { exact: true })).click()
      await expect(page).toHaveURL(item.url)

      // Verificación básica de que la página cargó (podemos buscar un encabezado o contenedor)
      // Cada página suele tener un título o un componente específico
      // Por simplicidad en este test de navegación, solo verificamos la URL
    }
  })

  test('should handle responsive sidebar on mobile', async ({ page }, testInfo) => {
    await applyLanguage(page, testInfo)
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/dashboard')
    const sidebarTrigger = page.locator('[data-sidebar="trigger"]')
    await expect(sidebarTrigger).toBeVisible()
    await sidebarTrigger.click()
    await expect(page.locator('[data-sidebar="sidebar"][data-mobile="true"]')).toBeVisible()
  })
})
