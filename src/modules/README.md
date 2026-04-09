# Modular Architecture

This folder is the application catalog for the template.

`src/modules/core` is the required kernel of that catalog, not a business module and not a home for shared infrastructure.

Each module owns:

- a manifest with metadata, routes, dependencies, and navigation
- the business boundary for a capability such as auth, AI, tasks, or projects
- the public API that other modules and routes should consume through the module barrel
- the future migration target for colocating UI, model, server, and integration code

Shared business capabilities that are reused by multiple modules belong under `src/modules/shared`, not in `src/features`.

Cross-cutting technical infrastructure belongs in `src/shared`, not in `src/modules/core`.

Current state:

- route files still live in `src/routes` because TanStack Start relies on file-based routing
- feature implementations now live in their owning folders under `src/modules/*`
- `src/features` is now a legacy compatibility facade and should not receive new business logic
- the module manifests now act as the source of truth for activation, navigation, and migration planning
- `src/modules/core` should stay small: types, registry, activation, and navigation runtime only

Target state per module:

```text
src/modules/<module>/
├── manifest.ts
├── index.ts
├── ui/
├── model/
├── api/
├── server/
├── config/
└── index.ts
```

Route files should become thin adapters that import screens or handlers from these modules.
