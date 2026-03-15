# Core Kernel

`src/modules/core` is the required kernel of the modular system.

It is always present, but it is not a business module and it must not become a catch-all for shared UI or shared infrastructure.

Keep here only:

- module manifest types
- module registry and activation rules
- module dependency resolution
- module-driven navigation/runtime helpers

Do not put here:

- reusable UI primitives
- auth, db, query, i18n, sentry, or provider infrastructure
- feature code shared by multiple business modules

Where those belong instead:

- cross-cutting infrastructure: `src/shared/*`
- generic UI: `src/components/ui/*` and selected shared composites
- shared business capability: `src/modules/shared/*`
