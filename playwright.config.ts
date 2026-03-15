import { defineConfig, devices } from '@playwright/test'

const languages = ['en', 'es', 'dk'] as const

const languageLocales: Record<(typeof languages)[number], string> = {
  en: 'en-US',
  es: 'es-ES',
  dk: 'da-DK',
}

const baseProjects = [
  {
    name: 'chromium',
    use: { ...devices['Desktop Chrome'] },
  },
  {
    name: 'firefox',
    use: { ...devices['Desktop Firefox'] },
  },
  {
    name: 'webkit',
    use: { ...devices['Desktop Safari'] },
  },
  {
    name: 'Mobile Chrome',
    use: { ...devices['Pixel 5'] },
  },
  {
    name: 'Mobile Safari',
    use: { ...devices['iPhone 12'] },
  },
]

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests/e2e',
  testIgnore: ['**/auth.local.spec.ts', '**/auth.logout.local.spec.ts'],
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: baseProjects.flatMap((project) =>
    languages.map((language) => ({
      name: `${project.name}-${language}`,
      metadata: {
        language,
      },
      use: {
        ...project.use,
        locale: languageLocales[language],
      },
    })),
  ),

  webServer: {
    command:
      'SKIP_AUTH=true VITE_SKIP_AUTH=true TEST_USER_ID=user_e2e_local VITE_TEST_USER_ID=user_e2e_local VITE_E2E=true npm run dev:server',
    url: 'http://localhost:3000',
    reuseExistingServer: false,
    timeout: 120 * 1000,
  },
})
