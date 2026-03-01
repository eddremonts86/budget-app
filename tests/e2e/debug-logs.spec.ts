import { test } from '@playwright/test'

test('get console logs from dashboard projects', async ({ page }) => {
  const logs: string[] = []
  page.on('console', (msg) => {
    logs.push(`[${msg.type()}] ${msg.text()}`)
  })

  page.on('pageerror', (err) => {
    logs.push(`[PAGE ERROR] ${err.message}`)
  })

  try {
    await page.goto('http://localhost:3000/dashboard/projects', {
      waitUntil: 'networkidle',
      timeout: 30000,
    })
    // Wait a bit for React Query to settle
    await page.waitForTimeout(5000)
  } catch (e) {
    logs.push(`[NAVIGATION ERROR] ${(e as Error).message}`)
  }

  console.log('--- BROWSER LOGS START ---')
  logs.forEach((log) => console.log(log))

  const content = await page.content()
  console.log('--- PAGE CONTENT SNIPPET ---')
  console.log(content.substring(0, 1000))

  // Check if any project from the DB is present
  // Based on check-projects-direct.ts, we have "Proyecto de Rediseño", "Sistema de Gestión", etc.
  const hasProject = content.includes('Proyecto') || content.includes('Sistema')
  console.log('Projects rendered:', hasProject)

  if (!hasProject) {
    throw new Error('No projects found in the page content')
  }

  console.log('--- BROWSER LOGS END ---')

  // Also take a screenshot to see what's happening
  await page.screenshot({ path: 'dashboard-projects.png' })
})
