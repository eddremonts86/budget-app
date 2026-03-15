const { chromium } = require('@playwright/test')
const fs = require('node:fs')

const BASE_URL = process.env.TARGET_URL || 'http://localhost:3000'
const OUTPUT_PATH = '/tmp/dashboard-check-result.json'

;(async () => {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 } })

  const consoleMessages = []
  const pageErrors = []
  const failedRequests = []
  const errorResponses = []

  async function inspectRoute(path) {
    const page = await context.newPage()

    page.on('console', (msg) => {
      consoleMessages.push({ route: path, type: msg.type(), text: msg.text() })
    })

    page.on('pageerror', (error) => {
      pageErrors.push({ route: path, text: error.message || String(error) })
    })

    page.on('requestfailed', (request) => {
      failedRequests.push({
        route: path,
        url: request.url(),
        failure: request.failure()?.errorText || 'unknown',
      })
    })

    page.on('response', (response) => {
      if (response.status() >= 400) {
        errorResponses.push({
          route: path,
          url: response.url(),
          status: response.status(),
        })
      }
    })

    const response = await page.goto(`${BASE_URL}${path}`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })
    await page.waitForTimeout(5000)

    const title = await page.title()
    const url = page.url()
    const bodyText = await page.locator('body').innerText()
    const headings = await page
      .locator('h1, h2')
      .allInnerTexts()
      .catch(() => [])
    const nav = await page
      .locator('nav a, aside a')
      .allInnerTexts()
      .catch(() => [])

    return {
      path,
      status: response?.status() ?? null,
      url,
      title,
      headings: headings
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 12),
      nav: nav
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 20),
      hasDashboardText: /dashboard|analytics|transactions|projects|todos|settings/i.test(bodyText),
      bodySample: bodyText.slice(0, 500),
    }
  }

  try {
    const results = []
    results.push(await inspectRoute('/dashboard'))
    results.push(await inspectRoute('/dashboard/todos'))
    results.push(await inspectRoute('/dashboard/settings/ia_config'))

    const screenshotPage = await context.newPage()
    await screenshotPage.goto(`${BASE_URL}/dashboard`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    })
    await screenshotPage.waitForTimeout(1500)
    await screenshotPage.screenshot({ path: '/tmp/dashboard-check.png', fullPage: true })
    await screenshotPage.close()

    const payload = {
      ok: true,
      results,
      consoleSummary: {
        total: consoleMessages.length,
        errors: consoleMessages.filter(
          (item) =>
            item.type === 'error' || item.type === 'warning' || /failed to fetch/i.test(item.text),
        ),
      },
      pageErrors,
      errorResponses,
      failedRequests,
      screenshot: '/tmp/dashboard-check.png',
    }
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2))
    console.log(JSON.stringify(payload, null, 2))
  } catch (error) {
    const payload = {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      consoleSummary: {
        total: consoleMessages.length,
        errors: consoleMessages.filter(
          (item) =>
            item.type === 'error' || item.type === 'warning' || /failed to fetch/i.test(item.text),
        ),
      },
      pageErrors,
      errorResponses,
      failedRequests,
    }
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2))
    console.log(JSON.stringify(payload, null, 2))
    process.exitCode = 1
  } finally {
    await browser.close()
  }
})()
