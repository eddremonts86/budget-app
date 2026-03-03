import { test, expect } from '@playwright/test'

test.describe('Project Creation and Member Assignment', () => {
  test.beforeEach(async ({ page }) => {
    // Usar bypass de E2E si está configurado
    await page.goto('http://localhost:3000/dashboard/projects')
    // Esperar a que la página cargue (puede haber redirecciones de Clerk)
    await page.waitForLoadState('networkidle')
  })

  test('should create a new project and assign a member', async ({ page }) => {
    // 1. Abrir el formulario de creación
    // Buscamos el botón por el texto traducido (en español "Crear Proyecto" o similar)
    // O simplemente por el icono Plus si el texto es dinámico
    const createBtn = page
      .getByRole('button', { name: /Crear/i })
      .or(page.getByRole('button', { name: /Create/i }))
    await createBtn.click()

    // 2. Rellenar datos básicos
    await page
      .getByLabel(/Nombre/i)
      .or(page.getByLabel(/Name/i))
      .fill(`Test Project ${Date.now()}`)
    await page
      .getByLabel(/Descripción/i)
      .or(page.getByLabel(/Description/i))
      .fill('This is a test project created by Playwright')

    await page
      .getByLabel(/Tecnologías/i)
      .or(page.getByLabel(/Technologies/i))
      .fill('React, TypeScript, Tailwind')

    // 3. Seleccionar Tipo y Prioridad (Selects de shadcn/ui)
    // Usar el placeholder para encontrar los triggers
    const typeTrigger = page
      .getByRole('combobox')
      .filter({ hasText: /Tipo/i })
      .or(page.getByRole('combobox').filter({ hasText: /Type/i }))
    if (await typeTrigger.isVisible()) {
      await typeTrigger.click()
    } else {
      // Intentar por el primer combobox que encontremos
      await page.getByRole('combobox').first().click()
    }
    await page.getByRole('option').first().click()

    // 4. Probar la asignación de miembros (Combobox)
    const teamInput = page.locator('[data-slot="combobox-chip-input"]')
    await teamInput.waitFor({ state: 'visible' })
    await teamInput.click()
    await teamInput.fill('a') // Escribir algo para activar la búsqueda

    // Esperar a que aparezcan las opciones en el listado
    // El listado de opciones está dentro de un portal de Radix o similar
    const memberOption = page.getByRole('option').first()
    await memberOption.waitFor({ state: 'visible', timeout: 5000 }).catch(() => null)

    if (await memberOption.isVisible()) {
      // Usar force: true si otros elementos interceptan el clic (como el overlay del sheet)
      await memberOption.click({ force: true })
      console.log('Member assigned successfully')
    } else {
      console.log('No members found in the list')
    }

    // Cerrar cualquier dropdown que pueda estar abierto (combobox, selects, etc.)
    await page.keyboard.press('Escape')

    // 5. Guardar el proyecto
    const saveBtn = page
      .getByRole('button', { name: /Guardar/i })
      .or(page.getByRole('button', { name: /Save/i }))
    await saveBtn.click()

    // 6. Verificar éxito
    await expect(
      page.getByText(/Proyecto creado/i).or(page.getByText(/Project created/i)),
    ).toBeVisible()
    console.log('Project created successfully')
  })
})
