const { chromium } = require('playwright')

const TARGET_URL = 'http://localhost:3000'
const routes = [
  { path: '/dashboard', label: 'dashboard' },
  { path: '/dashboard/users', label: 'users' },
  { path: '/dashboard/projects', label: 'projects' },
  { path: '/dashboard/todos', label: 'todos' },
  { path: '/dashboard/transactions', label: 'transactions' },
]

async function countVisibleRows(page) {
  const selectors = [
    'table tbody tr',
    '[role="rowgroup"] [role="row"]',
    '[data-testid="table-row"]',
    '[data-slot="table-row"]',
  ]

  for (const selector of selectors) {
    const count = await page.locator(selector).count()
    if (count > 0) {
      return { selector, count }
    }
  }

  return { selector: null, count: 0 }
}

;(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 40 })
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
  const summary = []

  try {
    for (const route of routes) {
      const url = `${TARGET_URL}${route.path}`
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
      await page.waitForTimeout(1200)

      const title = await page.title()
      const bodyText = await page.locator('body').innerText()
      const heading = await page.locator('h1, h2').first().textContent().catch(() => null)
      const { selector, count } = await countVisibleRows(page)

      summary.push({
        route: route.path,
        title,
        heading,
        rowSelector: selector,
        rowCount: count,
        hasError: /error|unexpected|exception|500 internal/i.test(bodyText),
      })

      await page.screenshot({ path: `/tmp/${route.label}.png`, fullPage: true })
    }

    console.log(JSON.stringify(summary, null, 2))
  } catch (error) {
    console.error('Smoke test failed:', error)
    process.exitCode = 1
  } finally {
    await browser.close()
  }
})()
