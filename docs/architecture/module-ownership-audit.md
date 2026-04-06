# Module Ownership Audit

## Goal

Define which folders remain global infrastructure and which ones should belong to a specific module so the template stays plug-and-play without mixing business ownership into framework-level folders.

## Decisions Applied In This Pass

- Auth page UI now lives in `src/modules/auth/ui` and `src/routes/auth/route.tsx` is only a thin route adapter.
- Landing shell now lives in `src/modules/landing/ui`.
- Dashboard shell and sidebar navigation now live in `src/modules/dashboard/ui`.
- Old import paths in `src/components` and `src/shared/layouts` were kept as compatibility facades so the refactor does not force a full-tree rewrite in one pass.

## Ownership Rules

### `src/modules/core/*`

This is the required kernel of the modular system.

Keep here only:

- module types
- module registry
- activation and dependency rules
- module-driven navigation helpers

Do not place here:

- shared UI
- shared providers
- auth, db, query, i18n, or sentry infrastructure
- business code reused by multiple modules

If something is shared but not part of module runtime itself, it belongs in `src/shared/*` or `src/modules/shared/*`, not in `src/modules/core/*`.

### `src/modules/*`

This is the product architecture layer.

- Put pages, layouts, route-facing UI, feature APIs, feature models, business hooks, server functions, and feature-specific configuration here.
- A module should export a small public API from its own barrel.
- Routes should import from modules, not own large page implementations.

### `src/components/*`

This folder should only keep generic reusable UI or composite infrastructure.

Keep here:

- `src/components/ui/*`
- generic composites such as language/theme controls
- reusable tables, charts, or display primitives that are not owned by one business module

Already moved out because they are module-owned shell code:

- `app-sidebar.tsx`
- `nav-main.tsx`
- `nav-secondary.tsx`
- `nav-user.tsx`
- `composite/Topbar/*`
- `site-header.tsx`
- `nav-documents.tsx`
- `section-cards.tsx`
- `chart-area-interactive.tsx`

Current organization inside `src/components`:

- `ui/*` contains shared primitives
- `composite/*` contains shared higher-level app UI
- `dashboard/*` contains compatibility facades for dashboard-owned code
- `legacy/*` contains compatibility wrappers around demo or legacy components

Reason: dashboard-oriented shell/widgets should not remain as source-of-truth in the shared components root, and legacy examples should be clearly separated from reusable shared UI.

### `src/shared/*`

This folder should remain cross-cutting application infrastructure.

Keep here:

- `shared/lib/api`
- `shared/lib/db`
- `shared/lib/query`
- `shared/lib/i18n`
- `shared/lib/sentry`
- `shared/providers/*`
- `shared/styles/*`
- `shared/ui/*`
- `shared/utils.ts`

Moved out in this pass:

- landing and dashboard layouts

Candidate for a later extraction into `src/modules/auth/infrastructure`:

- `shared/lib/auth/*`

Reason: today auth is consumed globally by the full app shell, so it is still acceptable in `shared`. If the template evolves toward optional auth packages per module set, this runtime should become auth-owned.

### `src/server/*`

This folder should not be a catch-all domain bucket.

Current state after migration:

- AI persistence data now lives in `src/modules/ai/data/*`.
- AI runtime diagnostics now live directly in `src/modules/ai/server`.

Decision:

- keep `src/server/*` free of AI-owned source-of-truth files
- move AI server helpers directly into `src/modules/ai/server`

### `src/modules/ai/*`

This folder is now the real module boundary and source of truth for AI runtime code.

Current state:

- `config`, `prompts`, `providers`, `rag`, `server`, and `storage` are all AI-domain code
- routes, settings, tests, and scripts consume AI through `src/modules/ai/*`
- AI-owned implementation now lives physically under `src/modules/ai/*`

Decision:

- `src/modules/ai/*` is the AI module boundary
- do not collapse it into `shared`
- preferred end-state is one of these two shapes:

Option A:

- `src/modules/ai/config`
- `src/modules/ai/prompts`
- `src/modules/ai/providers`
- `src/modules/ai/rag`
- `src/modules/ai/server`
- `src/modules/ai/storage`

Option B:

- `src/modules/ai/lib/*` for internal runtime folders

Recommended approach:

- keep all AI domain code under `src/modules/ai/*`
- import AI runtime from `src/modules/ai/*` and `@/modules/ai/*`
- avoid recreating top-level compatibility layers outside `src/modules/ai/*` for AI

### `src/shared/types/*`

This folder should remain under `shared` when it contains ambient declarations.

Keep global:

- `src/shared/types/react-syntax-highlighter.d.ts`

Reason: it patches external library typing for the whole app, not one domain module.

## Practical Rule For New Code

When adding a new file, ask this first:

- if removing a module should also remove the file, it belongs in that module
- if multiple modules need it and it has no business ownership, it belongs in `shared` or `components/ui`
- if it is only there to support routing, the route file should stay thin and import the module-owned implementation

## Recommended Next Wave

1. Move dashboard sample widgets from `src/components` into `src/modules/dashboard/ui`.
2. Introduce `src/modules/ai` compatibility exports for the current `src/ai` runtime tree.
3. Migrate AI-owned server files from `src/server` into the AI module once the AI compatibility layer exists.
4. Decide whether `shared/lib/auth` remains a platform service or becomes `modules/auth/infrastructure`.
