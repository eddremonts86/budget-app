# E2E Testing — Test Examples Reference

## Production Test Patterns

### Route Navigation Test (routes.navigation.spec.ts)

```ts
import { expect, test } from '@playwright/test'
import { uiRoutes } from './route-inventory'

test.describe('Route navigation', () => {
  for (const route of uiRoutes) {
    test(`navigates ${route.path}`, async ({ page }) => {
      const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' })

      expect(response, `No response for ${route.path}`).not.toBeNull()
      expect(response!.status(), `Unexpected status for ${route.path}`).toBeLessThan(500)

      if (route.redirectTo) {
        await expect(page).toHaveURL(new RegExp(`${route.redirectTo}$`))
      } else {
        await expect(page).toHaveURL(
          new RegExp(`${route.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`),
        )
      }

      await expect(page.locator('h1, h2, [role="main"], main').first()).toBeVisible()
    })
  }
})
```

Key patterns:

- Uses `route-inventory.ts` to test ALL routes automatically
- Status `< 500` catches server errors without hardcoding expected codes
- `redirectTo` handles auth redirects cleanly
- Selects first semantic heading/main — works across all pages

---

### Full CRUD E2E Test (entities.crud.spec.ts — condensed)

```ts
import { expect, test, type Locator, type Page } from '@playwright/test'
import { applyLanguage, getByLabelI18n } from './utils/i18n'

// Unique ID factory — prevents test collisions
const unique = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`

test.describe('Entities CRUD E2E', () => {
  test('creates, updates and deletes a project', async ({ page }, testInfo) => {
    test.setTimeout(180000)

    // Skip slow tests on mobile viewports
    test.skip(testInfo.project.name.includes('Mobile'), 'CRUD full flow validated on desktop only')

    // Language-aware test setup
    await applyLanguage(page, testInfo)

    const projectName = unique('PW Project')
    const updatedName = `${projectName} Updated`

    // Navigate
    await page.goto('/dashboard/projects')

    // Click create — locale-independent regex
    const createBtn = page.getByRole('button', {
      name: /Create New Project|Crear Nuevo Proyecto|Opret Nyt Projekt/i,
    })
    await expect(createBtn).toBeVisible({ timeout: 15000 })
    await createBtn.click()

    // Fill form using i18n-aware locator
    const nameInput = await getByLabelI18n(page, 'projects.form.nameLabel', { timeout: 15000 })
    await nameInput.fill(projectName)

    // Submit
    await page.getByRole('button', { name: /Submit|Crear|Opret/i }).click()

    // Verify creation
    await expect(page.getByText(projectName)).toBeVisible({ timeout: 15000 })
  })
})
```

---

### Auth Local Sign-In Test (auth.local.spec.ts)

```ts
import { test, expect } from '@playwright/test'
import {
  createAuthCredentials,
  provisionAccount,
  signInInBrowser,
  expectDashboard,
} from './utils/auth-local'

test.describe.serial('Better Auth local sign-in', () => {
  const creds = createAuthCredentials('e2e-login')

  test.beforeAll(async ({ request }) => {
    // Provision user via API (no browser interaction)
    await provisionAccount(request, creds)
  })

  test('signs in successfully', async ({ page }) => {
    await signInInBrowser(page, creds)
    await expectDashboard(page)
  })

  test('dashboard shows user info', async ({ page }) => {
    await signInInBrowser(page, creds)
    await page.goto('/dashboard')
    await expect(page.getByTestId('user-menu')).toBeVisible()
  })
})
```

Utilities:

```ts
// utils/auth-local.ts
export const createAuthCredentials = (prefix: string) => ({
  email: `${prefix}-${Date.now()}@test.local`,
  password: 'Test1234!',
})

export const provisionAccount = async (request, creds) => {
  // POST /api/auth/sign-up to create user without browser
}

export const signInInBrowser = async (page, creds) => {
  await page.goto('/auth')
  await page.getByTestId('auth-input-sign-in-email').fill(creds.email)
  await page.getByTestId('auth-input-sign-in-password').fill(creds.password)
  await page.getByTestId('auth-submit-sign-in').click()
}
```

---

### Bypass Mode Test (production pattern)

```ts
// playwright.config.ts uses env vars to configure bypass
// Run tests with bypass enabled:
// SKIP_AUTH=true VITE_SKIP_AUTH=true pnpm test:e2e

test.describe('Protected dashboard with bypass', () => {
  test('dashboard loads without login in bypass mode', async ({ page }) => {
    await page.goto('/dashboard')
    // No redirect — bypass is active
    await expect(page).toHaveURL(/\/dashboard/)
    await expect(page.locator('main')).toBeVisible()
  })
})
```

---

### Multi-Language Matrix Pattern

playwright.config.ts generates one project per language × browser:

```ts
// tests run for: en-US, es-ES, da-DK × chromium, firefox, webkit
const languages = ['en', 'es', 'dk'] as const
// Each spec gets testInfo.project.name like "chromium-en"

// In tests — handle multi-lang with regex:
await page.getByRole('button', {
  name: /Create|Crear|Opret/i, // matches all 3 locales
})

// Or use getByLabelI18n helper:
const input = await getByLabelI18n(page, 'projects.form.nameLabel')
// Fetches the translation at runtime and locates by translated text
```

---

### data-testid Conventions

```tsx
// Components (required conventions)
<Button data-testid="create-project-btn">Create Project</Button>
<input data-testid="auth-input-sign-in-email" />
<input data-testid="auth-input-sign-in-password" />
<button data-testid="auth-submit-sign-in">Sign In</button>
<div data-testid="user-menu">...</div>
<div data-testid="dashboard-heading">...</div>

// Convention: kebab-case, context-action or context-field
// Formats: {page}-{element}, {module}-{action}-{field}
```

---

### Test Cleanup Pattern

```ts
// Always use unique IDs per run to avoid conflicts
const unique = (prefix: string) => `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`
const projectName = unique('PW Project')

// After creating, always delete in teardown
test.afterEach(async ({ page }) => {
  // Navigate to created item, delete it via UI
  // OR use API call to server function for cleanup
})
```

---

### CI Config Summary

```bash
# .env.ci (or CI environment)
SKIP_AUTH=true
VITE_SKIP_AUTH=true
TEST_USER_ID=ci_test_user
VITE_TEST_USER_ID=ci_test_user
CI=true
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/test_db
```

playwright.config.ts CI overrides:

- `workers: 1` — sequential to avoid race conditions
- `retries: 2` — reruns flaky tests
- `screenshot: 'only-on-failure'` — saves space
- `video: 'retain-on-failure'` — diagnosis on failures

---

### Route Inventory (auto-generated)

```ts
// tests/e2e/route-inventory.ts
export const uiRoutes = [
  { path: '/', redirectTo: undefined },
  { path: '/auth', redirectTo: undefined },
  { path: '/dashboard', redirectTo: undefined },
  { path: '/dashboard/projects', redirectTo: undefined },
  { path: '/dashboard/tasks', redirectTo: undefined },
  { path: '/dashboard/users', redirectTo: undefined },
  // ... all routes auto-generated via:
  // pnpm tsx scripts/routes/generate-inventory.ts
]
```

Regenerate after adding routes: `pnpm tsx scripts/routes/generate-inventory.ts`
