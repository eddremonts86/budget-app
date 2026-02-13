import { expect, test } from '@playwright/test'
import {
  applyLanguage,
  getByRoleI18n,
  getByTextI18n,
} from './utils/i18n'

test.describe('Dashboard & Analytics', () => {
  test('should display dashboard statistics and recent transactions', async ({ page }, testInfo) => {
    await applyLanguage(page, testInfo)
    await page.goto('/dashboard')

    // Verificar que los encabezados de las tarjetas de estadísticas están presentes
    await expect(await getByTextI18n(page, 'dashboard.stats.totalRevenue')).toBeVisible()
    await expect(await getByTextI18n(page, 'dashboard.stats.subscriptions')).toBeVisible()
    await expect(await getByTextI18n(page, 'dashboard.stats.sales')).toBeVisible()
    await expect(await getByTextI18n(page, 'dashboard.stats.activeNow')).toBeVisible()

    // Verificar que la tabla de transacciones recientes existe
    await expect(await getByTextI18n(page, 'dashboard.recentTransactions')).toBeVisible()
    await expect(page.locator('table')).toBeVisible()
    
    // Verificar que hay al menos una fila en la tabla (asumiendo que hay datos en el mock)
    const rows = page.locator('table tbody tr')
    await expect(rows.count()).resolves.toBeGreaterThan(0)
  })

  test('should display analytics page correctly', async ({ page }, testInfo) => {
    await applyLanguage(page, testInfo)
    await page.goto('/dashboard/analytics')

    // Título de la página
    await expect(await getByRoleI18n(page, 'heading', 'analytics.title', { exact: true })).toBeVisible()
    
    // Tarjetas de analíticas
    await expect(await getByTextI18n(page, 'analytics.pageViews')).toBeVisible()
    await expect(await getByTextI18n(page, 'analytics.overview')).toBeVisible()
    
    // Placeholder del gráfico
    await expect(await getByTextI18n(page, 'analytics.placeholder')).toBeVisible()
  })
})
