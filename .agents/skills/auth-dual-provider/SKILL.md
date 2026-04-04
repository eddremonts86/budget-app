---
name: auth-dual-provider
description: Sistema de autenticación dual de TanStack Template. Usar cuando se trabaje con auth (Clerk + Better Auth), rutas protegidas, useAppAuth(), bypass dev/E2E, sign-in/sign-up, sesiones server-side, o el módulo src/modules/auth/*. Cubre los tres modos de auth (local, clerk, hybrid), bypass para dev/test, y el contexto AppAuth unificado.
---

# Auth Dual-Provider Skill

## Three Auth Modes

Controlled by `AUTH_MODE` / `VITE_AUTH_MODE` env var:

| Mode     | Providers Active                  | Use Case              |
| -------- | --------------------------------- | --------------------- |
| `local`  | Better Auth only (email/password) | Self-hosted, no Clerk |
| `clerk`  | Clerk only                        | SaaS with Clerk keys  |
| `hybrid` | Both (default)                    | Supports both flows   |

## Unified Auth Hook: `useAppAuth()`

**Always** use this — never import directly from Clerk or Better Auth:

```ts
import { useAppAuth } from '@/shared/lib/auth'

function MyComponent() {
  const auth = useAppAuth()
  // auth.isAuthenticated  → boolean
  // auth.isLoaded         → boolean (providers still initializing)
  // auth.user             → AppAuthUser | null
  // auth.userId           → string | null
  // auth.provider         → 'bypass' | 'clerk' | 'better-auth' | null
  // auth.authMode         → 'local' | 'clerk' | 'hybrid'
  // auth.canSignOut       → boolean (false in bypass mode)
  // auth.signOut()        → Promise<void>
}
```

## AppAuthUser Shape

```ts
interface AppAuthUser {
  id: string
  email: string
  name: string
  image: string | null
  role: string | null
}
```

## Bypass Mode (Dev / E2E)

When `VITE_SKIP_AUTH=true` or `VITE_E2E=true` on localhost:

```ts
auth.provider === 'bypass'
auth.canSignOut === false // ← Never show logout UI in bypass mode
auth.userId === 'test-user-id' // deterministic test user
```

```tsx
// ✅ Gate logout to non-bypass
{
  auth.canSignOut && <Button onClick={auth.signOut}>Sign Out</Button>
}
// ❌ Never:
// {auth.isAuthenticated && <Button onClick={auth.signOut}>Sign Out</Button>}
```

## Server-Side Auth (Route Handlers)

```ts
// In TanStack Start server functions / API routes
import { getAuthUser, requireAuthUser, ensureAppAuthSession } from '@/shared/lib/auth'

// Optional auth check (returns null if not authenticated)
const user = await getAuthUser(request)

// Throws 401 if not authenticated
const user = await requireAuthUser(request)

// Protected route helper — redirects to /auth if not authenticated
await ensureAppAuthSession(request)
```

## Protected Route Pattern

```tsx
// src/routes/_dashboard/route.tsx — route-level protection
import { createFileRoute, redirect } from '@tanstack/react-router'
import { ensureAppAuthSession } from '@/shared/lib/auth/server'

export const Route = createFileRoute('/_dashboard')({
  beforeLoad: async ({ context }) => {
    await ensureAppAuthSession(context.request)
  },
  component: DashboardLayout,
})
```

## Better Auth Client (Local Auth)

```ts
import { authClient } from '@/shared/lib/auth/better-auth-client'

// Sign in
await authClient.signIn.email({ email, password })

// Sign up
await authClient.signUp.email({ email, password, name })

// Sign out
await authClient.signOut()

// Session
const { data: session } = authClient.useSession()
```

## Clerk Integration

Clerk only activates when `VITE_CLERK_PUBLISHABLE_KEY` is set AND mode includes 'clerk'.
The `src/start.ts` **must** register `clerkMiddleware()` for Clerk to work.

```ts
// src/start.ts
import { clerkMiddleware } from '@clerk/tanstack-react-start/server'
export default defineConfig({
  middleware: [clerkMiddleware()],
})
```

## Auth Forms (Sign In / Sign Up)

```tsx
// src/modules/auth/ui/AuthPage.tsx — canonical auth page
// Uses Better Auth client directly for local/hybrid mode
// Uses Clerk's <SignIn /> component when Clerk is active

// ⚠️ HTML pattern attributes on inputs must avoid double-escaped backslashes
// ✅ Use:  pattern=".*[^ ].*"
// ❌ Never: pattern=".*\\S.*"  (causes valid input to be blocked)
```

## Better Auth DB Tables

Better Auth manages its own tables via Drizzle:

- `auth_users` — user identities
- `auth_sessions` — active sessions
- `auth_accounts` — OAuth account links
- `auth_verifications` — email verification tokens

Never directly write to these tables — use Better Auth's API.

## Environment Variables

```bash
# Auth mode
AUTH_MODE=hybrid                    # local | clerk | hybrid
VITE_AUTH_MODE=hybrid

# Better Auth
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=http://localhost:3000
VITE_BETTER_AUTH_URL=http://localhost:3000

# Clerk (optional — only if using Clerk)
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Dev bypass (never in production)
VITE_SKIP_AUTH=true                 # bypass all auth for local dev
VITE_E2E=true                       # bypass for E2E tests
```

## Auth Config Helpers

```ts
import {
  getAuthMode,
  isBetterAuthEnabled,
  isClerkEnabled,
  getBetterAuthUrl,
  getBetterAuthSecret,
  getClerkPublishableKey,
} from '@/shared/lib/auth/config'
```

## Checklist (Protected Feature)

- [ ] Route uses `ensureAppAuthSession()` in `beforeLoad`
- [ ] Components use `useAppAuth()` — never raw Clerk/Better Auth hooks
- [ ] Logout gated on `auth.canSignOut` (false in bypass)
- [ ] Server functions use `requireAuthUser()` for protected operations
- [ ] `AUTH_MODE` env set correctly for environment
- [ ] No `VITE_SKIP_AUTH` in production env files

---

## References

Load these files for real implementation patterns from the codebase:

- `references/auth-patterns.md` — AppAuthContext shape, server auth, bypass patterns, module manifest, Clerk integration, Better Auth session, protected route example
