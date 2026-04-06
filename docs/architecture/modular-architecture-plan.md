# Modular Architecture Plan

## Goal

Turn the template into a plug-and-play foundation where business capabilities can be enabled, disabled, added, or removed with minimal impact on the rest of the project.

This project is not a plain Node server, so a structure like `controllers/services/models/app.ts/server.ts` on its own would fight the framework. TanStack Start needs `src/routes` for file-based routing, so the correct target is:

- `src/routes` stays as the routing adapter layer
- `src/modules` becomes the business and product architecture layer
- `src/shared` stays as framework-wide reusable infrastructure

## Target Structure

```text
src/
├── modules/
│   ├── core/
│   │   ├── config.ts
│   │   ├── navigation.ts
│   │   ├── registry.ts
│   │   └── types.ts
│   ├── auth/
│   │   ├── manifest.ts
│   │   ├── ui/
│   │   ├── model/
│   │   ├── server/
│   │   └── index.ts
│   ├── ai/
│   ├── tasks/
│   ├── projects/
│   ├── users/
│   ├── landing/
│   └── ...
├── routes/
├── shared/
├── components/
├── hooks/
└── types/
```

## Design Rules

1. Routes are adapters, not business containers.
   Each route file should become thin and only connect TanStack Router to a module screen, loader, or handler.

2. Modules own capabilities end to end.
   A module should eventually contain its UI, model, validation, server functions, API integration, and module manifest.

3. Shared code stays generic.
   `src/shared` should only contain code that can be reused by multiple modules without introducing business coupling.
   Shared business domain pieces should live in `src/modules/shared`.

4. Navigation and activation come from module manifests.
   The app shell should not hardcode business areas directly.

5. Modules must be safe to disable.
   A disabled module should disappear from navigation and should not be required by unrelated modules.

## Implementation Phases

### Phase 1. Create the module contract

- Define `AppModuleManifest`
- Add route ownership metadata
- Add navigation metadata
- Add dependency metadata
- Add env-based enable/disable support

Status: implemented.

### Phase 2. Build the module registry

- Register current capabilities as modules
- Resolve dependencies centrally
- Expose helpers for route and navigation lookups

Status: implemented.

### Phase 3. Make the shell consume modules

- Generate sidebar sections from module manifests
- Resolve page titles from module navigation instead of hardcoded route assumptions
- Prepare future provider composition per module

Status: partially implemented.

### Phase 4. Thin the route layer

- Move route UI into `src/modules/<module>/ui`
- Move route server logic into `src/modules/<module>/server`
- Leave `src/routes/**/*.tsx` as minimal adapters

Recommended order:

- `auth`
- `landing`
- `settings`
- `tasks`
- `projects`
- `users`
- `ai`

### Phase 5. Migrate legacy features into modules

- legacy todos folder -> `src/modules/tasks`
- legacy projects folder -> `src/modules/projects`
- legacy users folder -> `src/modules/users`
- `src/ai` -> `src/modules/ai`
- public landing UI -> `src/modules/landing`
- auth UI/runtime adapters -> `src/modules/auth`

During migration:

- keep barrel exports stable
- create compatibility exports where needed
- move one capability at a time

Status: core feature folders moved into `src/modules/*`; remaining work is to reduce deep cross-module imports in favor of each module's public barrel.

### Phase 6. Add true plug-and-play controls

- `VITE_ENABLED_MODULES`
- `VITE_DISABLED_MODULES`
- optional per-module provider hooks
- optional per-module route bundles
- optional module health checks and docs

## Module Shape

Each module should converge on this shape:

```text
src/modules/tasks/
├── manifest.ts
├── ui/
│   ├── TasksPage.tsx
│   └── components/
├── model/
│   ├── task.types.ts
│   └── task.schema.ts
├── api/
│   ├── task.api.ts
│   └── task.queries.ts
├── server/
│   ├── task.functions.ts
│   └── task.handlers.ts
├── config/
├── hooks/
└── index.ts
```

## What Was Implemented Now

- introduced `src/modules/core/*`
- introduced module manifests for current capabilities
- added module registry and env-based activation
- wired dashboard navigation to read module manifests instead of hardcoded sections
- moved legacy feature implementations into their owning module folders
- introduced `src/modules/shared` for business-domain pieces reused by multiple modules
- removed `src/features` after migrating its public surface to `src/modules/*`
- documented the migration path

## Next Concrete Refactors

1. Move `src/routes/auth/route.tsx` page UI into `src/modules/auth/ui/AuthPage.tsx`.
2. Move landing route UI into `src/modules/landing/ui`.
3. Move settings route pages into `src/modules/settings/ui`.
4. Continue tightening module ownership so shared and cross-module concerns remain explicit.
5. Keep route adapters thin and import directly from `src/modules/*`.
