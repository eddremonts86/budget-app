import { chromium, type ConsoleMessage } from '@playwright/test'

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  page.on('console', (msg: ConsoleMessage) => {
    console.log(`BROWSER LOG: [${msg.type()}] ${msg.text()}`)
  })

  page.on('pageerror', (err: Error) => {
    console.log(`BROWSER ERROR: ${err.message}`)
  })

  console.log('Navigating to http://localhost:3000/dashboard/projects')
  await page.goto('http://localhost:3000/dashboard/projects')

  // Wait for some time to allow data loading
  console.log('Waiting for 5 seconds...')
  await page.waitForTimeout(5000)

  // Take a screenshot
  console.log('Taking screenshot...')
  await page.screenshot({ path: 'projects-screenshot.png', fullPage: true })

  // Get the page content
  // const content = await page.content();
  console.log('Page title:', await page.title())

  // Check for some elements
  const projectsTitle = await page.locator('h2:has-text("Projects")').count()
  console.log('Found "Projects" title:', projectsTitle > 0)

  const loader = await page.locator('.animate-spin').count()
  console.log('Found loader:', loader > 0)

  const errorAlert = await page.locator('.text-destructive').count()
  console.log('Found error alert:', errorAlert > 0)

  const cards = await page.locator('.flex-col.h-full').count() // This matches the Card component in ProjectsPage
  console.log('Found project cards:', cards)

  await browser.close()
}

main().catch(console.error)
