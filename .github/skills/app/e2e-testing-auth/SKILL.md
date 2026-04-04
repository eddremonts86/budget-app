---
name: e2e-testing-auth
description: Tests E2E con Playwright en TanStack Template. Usar cuando se escriban o modifiquen tests E2E, se necesite manejar autenticación en tests (bypass local o flujo real), se creen fixtures de datos, se prueben rutas protegidas, o se configure el entorno de CI para tests. Cubre auth bypass dev/E2E, Better Auth local, test utils, y el inventario de rutas.
---

# E2E Testing Auth Skill

## Test Configuration

Two config files:

- `playwright.config.ts` — Standard tests (auth.local.spec.ts excluded via `testIgnore`)
- `playwright.auth-local.config.ts` — Local auth flow tests (sign-in/sign-up/logout)

```bash
# Run all standard E2E tests
pnpm test:e2e

# Run local auth tests specifically
pnpm playwright test --config playwright.auth-local.config.ts

# Run a single spec
pnpm playwright test tests/e2e/routes.navigation.spec.ts

# Debug mode (headed)
pnpm playwright test --headed --debug
```

## Auth Bypass (Dev / E2E without login)

**Bypass allows E2E tests to skip the login flow.**
Active when ALL of these are true:

1. `NODE_ENV !== 'production'`
2. Localhost host (`localhost`, `127.0.0.1`, `::1`)
3. `SKIP_AUTH=true` + `VITE_SKIP_AUTH=true` (or `VITE_E2E=true`)

```bash
# Start dev server with bypass enabled
SKIP_AUTH=true VITE_SKIP_AUTH=true \
TEST_USER_ID=user_e2e_local \
VITE_TEST_USER_ID=user_e2e_local \
pnpm dev:server
```

The bypass user always resolves to `TEST_USER_ID`. The dashboard is accessible
without any redirect to `/auth`.

## Auth Test Utilities

```ts
// tests/e2e/utils/auth-local.ts  (import from here)
import {
  createAuthCredentials,
  provisionAccount,
  signInInBrowser,
  expectDashboard,
} from './utils/auth-local'

// Create unique credentials per test run (avoids conflicts)
const creds = createAuthCredentials('my-test-prefix')
// → { email: 'my-test-prefix-<timestamp>@test.local', password: 'Test1234!' }

// Provision user via API (no browser interaction needed)
await provisionAccount(request, creds)

// Sign in through UI
await signInInBrowser(page, creds)

// Assert user is on dashboard
await expectDashboard(page)
```

## Writing E2E Tests — Patterns

```ts
import { expect, test } from '@playwright/test'

// Serial tests that share state (sign-in flow)
test.describe.serial('my feature journey', () => {
  test('user can see the list', async ({ page }) => {
    await page.goto('/dashboard/my-feature')
    await expect(page.getByRole('heading', { name: /my feature/i })).toBeVisible()
  })

  test('user can create an item', async ({ page }) => {
    await page.goto('/dashboard/my-feature')
    await page.getByTestId('create-item-btn').click()
    await page.getByLabel('Name').fill('Test Item')
    await page.getByRole('button', { name: /create/i }).click()
    await expect(page.getByText('Test Item')).toBeVisible()
  })
})

// Parallel tests for independent scenarios
test.describe('route protection', () => {
  test('redirects unauthenticated users to /auth', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth$/)
  })
})
```

## Test Data IDs (data-testid)

```tsx
// Components should expose stable data-testid attributes:
<Button data-testid="create-item-btn">Create</Button>
<input data-testid="auth-input-sign-in-email" />
<button data-testid="auth-submit-sign-in">Sign In</button>
```

Convention: `kebab-case`, descriptive, `noun-action` or `context-field` format.

## Multi-Language Testing

The playwright config tests across all 3 locales:

```ts
// playwright.config.ts — auto-generates project per lang x browser
const languages = ['en', 'es', 'dk'] as const
// Each spec runs in en-US, es-ES, da-DK locales
```

Assertions should use regexes or `getByRole` (accessible) rather than text matching
to avoid locale-specific failures:

```ts
// ✅ Locale-independent
await expect(page.getByRole('button', { name: /submit/i })).toBeVisible()
await expect(page.getByTestId('dashboard-heading')).toBeVisible()

// ❌ Breaks in es/dk
await expect(page.getByText('Submit')).toBeVisible()
```

## Seed Data for Tests

```bash
# Prepare E2E DB with test user seeded
pnpm tsx scripts/testing/prepare-auth-e2e-db.ts

# Smoke test auth approval flow
bash scripts/testing/auth-local-approval-smoke.sh
```

## Route Inventory

```ts
// tests/e2e/route-inventory.ts
// Complete list of all app routes for automated route testing

// Generate up-to-date inventory
pnpm tsx scripts/routes/generate-inventory.ts
```

## CI Environment

```bash
# CI skips auth setup — bypass mode recommended
SKIP_AUTH=true
VITE_SKIP_AUTH=true
TEST_USER_ID=ci_test_user
VITE_TEST_USER_ID=ci_test_user
CI=true
```

In CI, `playwright.config.ts` sets:

- `workers: 1` (sequential)
- `retries: 2`
- `screenshot: 'only-on-failure'`

## Checklist (New E2E Test)

- [ ] Uses `data-testid` for selectors (not text or CSS)
- [ ] Auth-dependent tests use bypass or `provisionAccount`
- [ ] Assertions are locale-independent (regex, role, testId)
- [ ] Destructive operations (delete) use `test.describe.serial`
- [ ] Test cleans up created data or uses unique IDs per run
- [ ] Added to the correct spec file (auth vs feature vs navigation)
- [ ] Works with `playwright.config.ts` multi-lang matrix

---

## References

Load these files for real test patterns and utilities from the production test suite:

- `references/test-examples.md` — Route navigation tests, full CRUD E2E pattern, auth bypass test, local auth approval flow, i18n test utils (`applyLanguage`, `getByLabelI18n`), `provisionAccount` helper, CI config, spec file inventory
