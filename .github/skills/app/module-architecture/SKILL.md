---
name: module-architecture
description: Arquitectura modular de TanStack Template. Usar cuando se creen, muevan o refactoricen módulos en src/modules/*, se modifiquen manifests, registry, barrels, o se deban respetar las reglas de propiedad de módulos (module ownership). También aplica cuando se trabaja con src/routes como adaptadores delgados o con src/modules/core como kernel.
---

# Module Architecture Skill

## Core Mental Model

Every business capability lives in `src/modules/<name>/`. Routes are thin adapters.
**Never** add business logic to `src/routes/`, `src/shared/`, or `src/modules/core/`.

## Module Anatomy

```
src/modules/<name>/
├── manifest.ts        ← source of truth: id, routes, navigation, dependencies
├── index.ts           ← public barrel (only export public API)
├── model/             ← types.ts, schema.ts (Zod), index.ts
├── api/               ← *.fn.ts (server fns / axios calls) + *.queries.ts (TQ hooks)
├── components/ | ui/  ← React components owned by this module
├── server/            ← server-only helpers (never imported client-side)
└── config/            ← module config, env resolution
```

## Manifest Contract

Every module **must** export a typed `AppModuleManifest` from `manifest.ts`:

```ts
import type { AppModuleManifest } from '@/modules/core/types'

export const myModule: AppModuleManifest = {
  id: 'my-module', // unique slug, kebab-case
  title: 'My Module',
  description: 'One line description.',
  enabledByDefault: true, // omit = true
  dependencies: ['core', 'dashboard'], // IDs of required modules
  routes: [{ path: '/dashboard/my-module', kind: 'page' }],
  navigation: [
    {
      id: 'workspace',
      title: 'Workspace',
      kind: 'main',
      order: 50,
      items: [
        {
          id: 'my-module',
          titleKey: 'sidebar.main.myModule',
          fallbackTitle: 'My Module',
          to: '/dashboard/my-module',
          icon: IconBuildingStore,
          order: 60,
        },
      ],
    },
  ],
}
```

After creating the manifest, register it in `src/modules/core/registry.ts`.

## Ownership Rules (CRITICAL)

| Location              | Allowed                                                                |
| --------------------- | ---------------------------------------------------------------------- |
| `src/modules/<name>/` | All business logic, UI, server helpers                                 |
| `src/modules/core/`   | Only: `types.ts`, `registry.ts`, `config.ts`, `navigation.ts`          |
| `src/modules/shared/` | Business-domain code reused by 2+ modules                              |
| `src/shared/`         | Cross-cutting infra: api client, query wrappers, auth lib, i18n, utils |
| `src/routes/`         | Thin adapters only — import pages from owning module                   |
| `src/components/ui/`  | Generic Shadcn/Radix primitives only                                   |

**Never** import from another module's internal paths. Only consume through the public `index.ts` barrel.

## Barrel Pattern

```ts
// src/modules/projects/index.ts — only public API
export { ProjectsPage } from './components/ProjectsPage'
export { ProjectForm } from './components/ProjectForm'
export * from './api/projects.fn'
export * from './api/projects.queries'
export { PROJECT_MEMBER_ROLES } from './model/types'
// ❌ NEVER export internal helpers or private components
```

## Route Adapter Pattern

```tsx
// src/routes/_dashboard/projects.tsx — thin adapter
import { createFileRoute } from '@tanstack/react-router'
import { ProjectsPage } from '@/modules/projects'

export const Route = createFileRoute('/_dashboard/projects')({
  component: ProjectsPage,
})
```

## Registry Registration

After creating `manifest.ts`, add to `src/modules/core/registry.ts`:

```ts
import { myModule } from '@/modules/my-module/manifest'
// Add to moduleRegistry array in the correct order (UI render order)
export const moduleRegistry: AppModuleManifest[] = [
  // ...existing,
  myModule,
]
```

## Module Activation & Dependencies

- `enabledByDefault: false` → module is off unless explicitly enabled via env
- `dependencies: ['auth']` → module is auto-activated when 'auth' is active
- `VITE_ENABLED_MODULES=projects,tasks` env overrides defaults

## Navigation Integration

Navigation sections have `kind: 'main' | 'secondary'` and `order` for sorting.
Items inside have `order` for relative position within the section.
Sidebar reads sections dynamically via `getEnabledModules()` → navigation runtime.

## Checklist (New Module)

- [ ] `manifest.ts` with correct `id`, `routes`, `navigation`
- [ ] Registered in `src/modules/core/registry.ts`
- [ ] `index.ts` barrel with only public exports
- [ ] `model/` with TypeScript types + Zod schemas
- [ ] `api/` with `*.fn.ts` (server/axios) + `*.queries.ts` (TQ hooks)
- [ ] Route file in `src/routes/` is a thin adapter
- [ ] No cross-module internal imports
- [ ] i18n keys added to all 3 locale files (en/es/dk)

## References

Load these files for real implementation patterns from the codebase:

- `references/module-patterns.md` — manifest shape, registry registration, barrel pattern, route adapter, owned-files inventory, anti-pattern examples
- `src/modules/projects/` — canonical reference implementation (most complete module)
