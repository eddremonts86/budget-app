# Scripts

This directory only keeps real operational entrypoints grouped by responsibility.

## Folders

- `ai/`: AI runtime bootstrap, smoke checks, RAG ingestion, and provider switching.
- `db/`: database seeding utilities and dataset generators.
- `dev/`: local development preflight checks.
- `docker/`: Docker stack migration, verification, and reset flows.
- `routes/`: route inventory and routing maintenance helpers.
- `testing/`: test helpers that orchestrate local CI-like flows.

## Main Entrypoints

- `pnpm ai:switch`
- `pnpm rag:ingest`
- `pnpm test:ai-integration`
- `pnpm test:seeded:smoke`
- `pnpm db:seed`
- `pnpm db:seed:generate`
- `pnpm db:seed:import`
- `pnpm db:seed:realistic`
- `pnpm db:seed:complex`
- `pnpm db:seed:tx232`
- `pnpm docker:up`
- `pnpm docker:up:full`
- `pnpm docker:check`
- `pnpm docker:reset`
- `pnpm routes:inventory`

Files under these folders may import local helpers, but new root-level script wrappers should not be added again.
