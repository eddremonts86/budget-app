const { chromium } = require('playwright')

const TARGET_URL = 'http://localhost:3000'
const credentials = {
  name: `Hybrid Flow ${Date.now()}`,
  email: `hybrid-flow-${Date.now()}@example.com`,
  password: 'Passw0rd!234',
}

async function textContent(page, selector) {
  const locator = page.locator(selector)
  if ((await locator.count()) === 0) {
    return null
  }
  return await locator.first().textContent()
}

;(async () => {
  const browser = await chromium.launch({ headless: false, slowMo: 75 })
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } })
  const summary = {
    targetUrl: TARGET_URL,
    authModeExpected: 'hybrid',
    localFlow: {},
    clerkState: {},
  }

  try {
    await page.goto(TARGET_URL, { waitUntil: 'networkidle', timeout: 30000 })
    summary.landingTitle = await page.title()
    summary.topbarAuthVisible = await page.getByTestId('topbar-auth-link').isVisible()

    await page.getByTestId('topbar-auth-link').click()
    await page.waitForURL('**/auth', { timeout: 15000 })

    summary.authPath = page.url()
    summary.localTabVisible = await page.getByTestId('auth-tab-sign-in').isVisible()
    summary.signUpTabVisible = await page.getByTestId('auth-tab-sign-up').isVisible()
    summary.clerkButtonVisible = await page.getByRole('button', { name: /continue/i }).isVisible().catch(() => false)
    summary.clerkOfflineLabel = await textContent(page, 'text=Temporarily unavailable')
    summary.clerkUnavailableLabel = await textContent(page, 'text=Unavailable')

    await page.getByTestId('auth-tab-sign-up').click()
    await page.locator('#sign-up-name').fill(credentials.name)
    await page.locator('#sign-up-email').fill(credentials.email)
    await page.locator('#sign-up-password').fill(credentials.password)
    await page.getByTestId('auth-submit-sign-up').click()

    await page.waitForURL('**/dashboard', { timeout: 30000 })
    summary.localFlow.afterSignupUrl = page.url()
    summary.localFlow.dashboardVisible = await page.getByTestId('dashboard-shell').isVisible()
    summary.localFlow.userMenuVisible = await page.getByTestId('dashboard-user-menu-trigger').isVisible()

    await page.goto(`${TARGET_URL}/auth`, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForURL('**/dashboard', { timeout: 15000 })
    summary.localFlow.authRedirectWhileAuthenticated = page.url()

    await page.getByTestId('dashboard-user-menu-trigger').click()
    await page.getByTestId('dashboard-sign-out').click()
    await page.waitForURL('**/', { timeout: 15000 })
    summary.localFlow.afterLogoutUrl = page.url()
    summary.localFlow.topbarAuthAfterLogout = await page.getByTestId('topbar-auth-link').isVisible()

    await page.screenshot({ path: '/tmp/hybrid-auth-flow.png', fullPage: true })
    summary.screenshot = '/tmp/hybrid-auth-flow.png'

    console.log(JSON.stringify(summary, null, 2))
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          status: 'failed',
          targetUrl: TARGET_URL,
          error: error.message,
          stack: error.stack,
          partialSummary: summary,
        },
        null,
        2,
      ),
    )
    process.exitCode = 1
  } finally {
    await browser.close()
  }
})()
