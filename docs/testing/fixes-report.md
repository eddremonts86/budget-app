# Fixes report

## 2026-03-03

### 1) Auth bypass (local only)

- Added centralized bypass helpers:
  - `src/shared/lib/auth/bypass.server.ts`
  - `src/shared/lib/auth/bypass.client.ts`
- Updated auth guard and user sync path to use bypass helpers:
  - `src/shared/lib/auth/server.ts`
  - `src/modules/dashboard/ui/shell/DashboardLayout.tsx`
  - `src/modules/users/context/UserProvider.tsx`
  - `src/routes/-root-components/RootErrorContent.tsx`
- Enforced production safety and localhost constraints.

### 2) Playwright execution consistency

- Updated `playwright.config.ts` to inject deterministic bypass envs during web server startup.

### 3) Route inventory deliverables

- Added inventory files:
  - `docs/testing/routes-inventory.yaml`
  - `tests/e2e/route-inventory.ts`

### 4) E2E suite restructuring

- Removed legacy debug/flaky specs.
- Added modular suite:
  - `tests/e2e/routes.navigation.spec.ts`
  - `tests/e2e/routes.api.spec.ts`
  - `tests/e2e/ui.interactions.spec.ts`
  - `tests/e2e/ui.responsive.spec.ts`
  - `tests/e2e/ui.accessibility.spec.ts`

### 5) MCP automation artifacts

- Added `docs/testing/mcp-automation.yaml` with route discovery, test generation and test-state workflows.
