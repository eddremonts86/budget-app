---
name: "integrations-expert"
description: "Expert on Clerk, Sentry, and Percy integrations. Invoke when configuring auth, error monitoring, or visual testing."
---

# Integrations Expert

This skill provides expertise on integrating and managing Clerk (Auth), Sentry (Monitoring), and Percy (Visual Testing) within the TanStack Start ecosystem.

## Core Capabilities

1.  **Clerk Authentication**:
    -   Configure `ClerkProvider` in `__root.tsx` or root layout.
    -   Manage protected routes and authentication state.
    -   Utilize Clerk hooks (`useUser`, `useAuth`) effectively.

2.  **Sentry Monitoring**:
    -   Initialize Sentry with `initSentry` in the entry point.
    -   Configure `Sentry.captureException` for error boundaries.
    -   Ensure sourcemaps and release management (if applicable).

3.  **Percy Visual Testing**:
    -   Integrate Percy with Playwright tests.
    -   Run visual regression tests using `@percy/playwright`.
    -   Manage snapshots and visual diffs.

## Integration Checklist

### Clerk
-   [ ] Env vars: `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`.
-   [ ] Wrap app in `ClerkProvider`.
-   [ ] Middleware/Protection logic (if using TanStack Start server functions).

### Sentry
-   [ ] Env var: `VITE_SENTRY_DSN`.
-   [ ] `Sentry.init` called early.
-   [ ] Error Boundary hooked up to Sentry.

### Percy
-   [ ] Env var: `PERCY_TOKEN`.
-   [ ] `@percy/playwright` installed.
-   [ ] Update E2E tests to take snapshots: `await percySnapshot(page, 'Name')`.

## Example Usage

-   "How do I protect a route with Clerk?"
-   "Setup Sentry for this project."
-   "Run visual tests with Percy."
