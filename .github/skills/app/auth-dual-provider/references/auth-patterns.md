# Auth Dual-Provider — Deep Reference

## Real AppAuthContext Implementation

Source: `src/shared/lib/auth/app-auth.tsx`

```ts
// The unified context shape (exact production types)
export type AppAuthProviderKind = 'bypass' | 'clerk' | 'better-auth' | null

export interface AppAuthUser {
  id: string
  email: string
  name: string
  image: string | null
  role: string | null
}

// Context value — always use useAppAuth() to access this
interface AppAuthContextValue {
  authMode: 'local' | 'clerk' | 'hybrid'
  provider: AppAuthProviderKind
  isLoaded: boolean
  isAuthenticated: boolean
  userId: string | null
  user: AppAuthUser | null
  canSignOut: boolean
  signOut: () => Promise<void>
}
```

---

## Real Server Auth Implementation

Source: `src/shared/lib/auth/server.ts`

```ts
export const getAuthUser = async (): Promise<ServerAuthUser> => {
  const authMode = getAuthMode()

  // 1. Bypass mode (dev/E2E only)
  if (isServerAuthBypassEnabled()) {
    return {
      authMode,
      provider: 'bypass',
      userId: getServerTestUserId(),
      email: 'local-test@example.com',
      name: 'Local Test User',
      image: null,
      role: 'admin',
    }
  }

  // 2. Better Auth (local mode or hybrid)
  if (isBetterAuthEnabled()) {
    const headers = getRequestHeaders()
    const session = await betterAuth.api.getSession({ headers })
    if (session?.user?.id) {
      return { authMode, provider: 'better-auth', userId: session.user.id, ... }
    }
  }

  // 3. Clerk (clerk mode or hybrid)
  if (isClerkServerEnabled()) {
    const { auth: clerkAuth } = await import('@clerk/tanstack-react-start/server')
    const user = await clerkAuth()
    if (user.userId) {
      return { authMode, provider: 'clerk', userId: user.userId, ... }
    }
  }

  return { authMode, provider: null, userId: null, ... }
}
```

Resolution order: bypass → Better Auth → Clerk → null  
**This order is production behaviour and must not be changed.**

---

## Auth Server Helper Functions

```ts
// src/shared/lib/auth/server.ts — all server-only exports

// Check if authenticated (null if not)
const user = await getAuthUser()

// Throw 401 if not authenticated
const user = await requireAuthUser()

// Throw 401 + redirect to /auth for protected pages
await ensureAppAuthSession()
```

---

## Protected Route Pattern (production example)

```tsx
// src/routes/_dashboard/route.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_dashboard')({
  beforeLoad: async ({ context }) => {
    const user = await getAuthUser()
    if (!user.userId) {
      throw redirect({ to: '/auth' })
    }
  },
  component: DashboardLayout,
})
```

---

## Better Auth Client (email/password flows)

```ts
// From src/shared/lib/auth/better-auth-client.ts
import { authClient } from '@/shared/lib/auth/better-auth-client'

// Sign in (local/hybrid mode)
const { data, error } = await authClient.signIn.email({ email, password })

// Sign up
const { data, error } = await authClient.signUp.email({ email, password, name })

// Session subscription (realtime updates)
const { data: session, isPending } = authClient.useSession()

// Sign out
await authClient.signOut()
```

---

## Bypass Mode Details

Bypass is active when ALL conditions are met:

1. `process.env.NODE_ENV !== 'production'`
2. Request origin is localhost (`localhost`, `127.0.0.1`, `::1`)
3. `SKIP_AUTH=true` (server) + `VITE_SKIP_AUTH=true` (client)

```ts
// The bypass user is deterministic — same ID every time
// Server: getServerTestUserId() → process.env.TEST_USER_ID ?? 'test-user-local'
// Client: getClientTestUserId() → import.meta.env.VITE_TEST_USER_ID ?? 'test-user-local'
```

**Bypass rules:**

- `auth.provider === 'bypass'`
- `auth.canSignOut === false` — **never render logout button in bypass mode**
- `auth.isAuthenticated === true` — app treats bypass as authenticated
- The bypass user has `role: 'admin'` for development convenience

```tsx
// Component: always gate signOut on canSignOut
{
  auth.canSignOut && <DropdownMenuItem onClick={auth.signOut}>{t('nav.signOut')}</DropdownMenuItem>
}
```

---

## Auth Mode Config Helpers

```ts
import {
  getAuthMode, // 'local' | 'clerk' | 'hybrid'
  isBetterAuthEnabled, // mode includes 'local' or 'hybrid'
  isClerkEnabled, // mode includes 'clerk' or 'hybrid'
  getBetterAuthUrl, // BETTER_AUTH_URL env
  getClerkPublishableKey, // VITE_CLERK_PUBLISHABLE_KEY env
} from '@/shared/lib/auth/config'
```

---

## Auth Form Patterns (from AuthPage.tsx)

```tsx
// Key gotcha: HTML pattern attribute — use literal special chars, not escaped
// ✅ Correct:
<input pattern=".*[^ ].*" />

// ❌ Breaks valid input (double-escaped backslash):
<input pattern=".*\\S.*" />
```

---

## Environment Matrix

| Variable                     | Scope  | Mode             | Required              |
| ---------------------------- | ------ | ---------------- | --------------------- |
| `AUTH_MODE`                  | Server | All              | Yes (default: hybrid) |
| `VITE_AUTH_MODE`             | Client | All              | Yes                   |
| `BETTER_AUTH_SECRET`         | Server | local / hybrid   | Yes                   |
| `BETTER_AUTH_URL`            | Server | local / hybrid   | Yes                   |
| `VITE_BETTER_AUTH_URL`       | Client | local / hybrid   | Yes                   |
| `VITE_CLERK_PUBLISHABLE_KEY` | Client | clerk / hybrid   | Yes for Clerk         |
| `CLERK_SECRET_KEY`           | Server | clerk / hybrid   | Yes for Clerk         |
| `VITE_SKIP_AUTH`             | Client | Dev / E2E bypass | Never in prod         |
| `SKIP_AUTH`                  | Server | Dev / E2E bypass | Never in prod         |
| `VITE_TEST_USER_ID`          | Client | Dev / E2E bypass | Optional              |
| `TEST_USER_ID`               | Server | Dev / E2E bypass | Optional              |

---

## Security Rules

1. **Never expose `CLERK_SECRET_KEY` or `BETTER_AUTH_SECRET` to client bundle** (no `VITE_` prefix)
2. **Never set `VITE_SKIP_AUTH=true` in `.env.production`** — enforces app-level auth bypass
3. **All server functions that touch user data must call `requireAuthUser()`**
4. **Never read auth state from cookies/localStorage manually** — use `useAppAuth()` or server helpers
