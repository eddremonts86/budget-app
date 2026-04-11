# TanStack Template - Copilot Instructions

## Mandatory Validation Rule

**NEVER mark a task as complete without first validating it using MCP browser tools.**

For any change that affects UI or routing:

1. Navigate to the affected page using `mcp_io_github_chr_navigate_page`
2. Take a screenshot with `mcp_io_github_chr_take_screenshot` and confirm the change works visually
3. Check the console for errors with `mcp_io_github_chr_list_console_messages`
4. Only then signal task completion

Auth bypass for local validation: set `VITE_SKIP_AUTH=true` and `VITE_TEST_USER_ID=user_1` in `.env.development` (localhost only — revert before committing).

## Project Overview

This is a modern full-stack web application template built with TanStack Start, React 19, and TypeScript. It serves as a foundation for creating web applications with a robust, type-safe architecture.

## Tech Stack

### Core Framework

- **TanStack Start** - Full-stack React framework with SSR, server functions, and file-based routing
- **React 19** - Latest React with concurrent features
- **TypeScript** - Strict type checking enabled
- **Vite 7** - Fast build tool and dev server

### TanStack Ecosystem

- **TanStack Router** - Type-safe routing with file-based routes in `src/routes/`
- **TanStack Query** - Server state management with custom wrappers (`useTQuery`, `useTQMutation`, etc.)
- **TanStack Form** - Performant forms with Zod validation
- **TanStack Table** - Headless table utilities
- **TanStack Virtual** - Virtualization for large lists

### UI & Styling

- **Tailwind CSS 4** - Utility-first CSS with theme customization
- **tailwindcss-animate** - Animation utilities
- **Shadcn UI ready** - Component library patterns
- **Dark/Light theme** - System preference detection with manual toggle

### Data & API

- **Axios** - HTTP client with interceptors for auth and error handling
- **Zod** - Schema validation for forms and API responses
- **json-server** - Mock API for development

### Authentication & Monitoring

- **Clerk** - Authentication (configured but requires API keys)
- **Sentry** - Error tracking and performance monitoring

### i18n

- **react-i18next** - Internationalization
- Supported languages: English (en), Spanish (es), Danish (dk)
- Locale files in `src/locales/{lang}/`

### Code Quality

- **ESLint** - Linting (flat config, typescript-eslint)
- **Prettier** - Code formatting
- **Playwright** - E2E testing
- **Vitest** - Unit testing

## Project Structure

```
src/
├── app/                    # Application configuration
│   ├── providers/          # React context providers
│   │   ├── theme-provider.tsx
│   │   ├── query-provider.tsx
│   │   ├── i18n-provider.tsx
│   │   └── index.tsx       # Combined AppProviders
│   └── styles/
│       └── globals.css     # Tailwind + theme variables
├── features/               # Feature-based modules
│   └── example-todo/       # Example feature
│       ├── api/            # API calls and query hooks
│       ├── model/          # Types and schemas
│       ├── ui/             # React components
│       └── index.ts        # Public API (barrel file)
├── routes/                 # TanStack Router pages
│   ├── __root.tsx          # Root layout
│   ├── index.tsx           # Homepage
│   └── todos.tsx           # Todos page
├── shared/                 # Shared utilities
│   ├── lib/
│   │   ├── api/            # Axios client + interceptors
│   │   ├── query/          # TanStack Query wrappers
│   │   ├── i18n/           # i18n configuration
│   │   ├── sentry/         # Error tracking
│   │   └── utils.ts        # Utility functions (cn)
│   └── ui/                 # Shared UI components
├── locales/                # Translation files
│   ├── en/
│   ├── es/
│   └── dk/
mocks/
├── db.json                 # json-server mock data
tests/
└── e2e/                    # Playwright tests
```

## Code Conventions

### TypeScript

- Strict mode enabled
- Use `type` imports for types: `import type { ... }`
- Prefer interfaces for object shapes, types for unions/intersections
- No `any` - use `unknown` and narrow types

### React Components

- Functional components only
- Use named exports (not default exports)
- Props interface above component: `interface ComponentProps { ... }`
- Destructure props in function signature

### TanStack Query Patterns

Use the custom wrappers in `@/shared/lib/query`:

```typescript
// Queries
const { data, isLoading } = useTQuery(
  ['todos', filters],
  () => todoApi.getAll(filters),
  { cache: 'standard' }, // 'realtime' | 'standard' | 'stable' | 'static'
)

// Mutations
const createTodo = useTQMutation(['todos', 'create'], todoApi.create, {
  invalidateKeys: [['todos', 'list']],
  successMessage: 'Todo created!',
})
```

### Feature Module Pattern

Each feature in `src/features/` should:

1. Have clear boundaries with a barrel file (`index.ts`)
2. Only expose public API through the barrel
3. Use internal folders: `api/`, `model/`, `ui/`, `hooks/`
4. Keep feature-specific logic contained

### Styling

- Use Tailwind utility classes
- Use `cn()` helper for conditional classes
- Theme colors via CSS variables (`bg-background`, `text-foreground`, etc.)
- Animations: `animate-in`, `fade-in`, `slide-in-from-*`

### i18n

- Use `useTranslation()` hook
- Keys follow namespace pattern: `namespace.key` (e.g., `todo.fields.title`)
- Add translations to all three locale files

### Forms

Use TanStack Form with Zod validation:

```typescript
const form = useForm({
  defaultValues: { ... },
  validatorAdapter: zodValidator(),
  validators: { onChange: schema },
  onSubmit: async ({ value }) => { ... },
})
```

## Commands

```bash
pnpm dev          # Start dev server + mock API
pnpm dev:server   # Start only Vite dev server
pnpm dev:mock     # Start only json-server
pnpm build        # Production build
pnpm lint         # Run ESLint
pnpm lint:fix     # Fix lint issues
pnpm format       # Format code with Prettier
pnpm format:check # Check formatting
pnpm type-check   # TypeScript check
pnpm test:e2e     # Run Playwright tests
```

## Environment Variables

Required in `.env.development`:

- `VITE_API_URL` - API base URL (default: http://localhost:3001)
- `VITE_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `VITE_SENTRY_DSN` - Sentry DSN (optional)
- `VITE_DEFAULT_LOCALE` - Default language (en/es/dk)

## Best Practices

1. **Keep features isolated** - Don't import from feature internals
2. **Use query wrappers** - They handle caching, errors, and toasts
3. **Validate with Zod** - Both forms and API responses
4. **Translate everything** - No hardcoded strings in components
5. **Test critical paths** - E2E tests for main user flows
6. **Type everything** - Leverage TypeScript's strict mode

## Project-Specific Skills (load before working in the domain)

> Skills are split into two tiers:
>
> - **`app/`** — Built for this repo. Contain real source code, real paths, production patterns. **Load these first.**
> - **`vendor/`** — Installed via `skills-lock.json`. Generic ecosystem knowledge. Combine with app skills.

### App Skills — `.github/skills/app/`

| Domain                               | Skill File                                         |
| ------------------------------------ | -------------------------------------------------- |
| Module architecture & manifests      | `.github/skills/app/module-architecture/SKILL.md`  |
| CRUD operations & CrudSheet Protocol | `.github/skills/app/feature-crud/SKILL.md`         |
| **Sheet / side-panel UI convention** | `.github/skills/app/crud-sheet/SKILL.md`           |
| Widget system (create / fix widgets) | `.github/skills/app/widget-system/SKILL.md`        |
| Multi-provider AI system             | `.github/skills/app/ai-providers/SKILL.md`         |
| Auth (Clerk + Better Auth)           | `.github/skills/app/auth-dual-provider/SKILL.md`   |
| Drizzle ORM + DB schema              | `.github/skills/app/drizzle-db/SKILL.md`           |
| i18n (EN/ES/DK translations)         | `.github/skills/app/i18n-deep/SKILL.md`            |
| Playwright E2E + auth bypass         | `.github/skills/app/e2e-testing-auth/SKILL.md`     |
| Docker + local AI stack              | `.github/skills/app/docker-ai-stack/SKILL.md`      |
| **Toast delete confirmations**       | `.github/skills/app/toast-confirm-delete/SKILL.md` |
| **Shadcn-first UI rule**             | `.github/skills/app/shadcn-first/SKILL.md`         |
| **Data tables (unified)**            | `.github/skills/app/data-tables/SKILL.md`          |

### Vendor Skills — `.github/skills/vendor/`

| Skill                                 | Domain                                    |
| ------------------------------------- | ----------------------------------------- |
| `tanstack-router-best-practices`      | Type-safe routing, loaders, search params |
| `tanstack-query-best-practices`       | Server state, cache, mutations            |
| `tanstack-start-best-practices`       | Server functions, SSR, middleware         |
| `tanstack-integration-best-practices` | Router + Query + Start integration        |
| `shadcn-ui` / `shadcn`                | Shadcn/Radix components, forms, themes    |
| `typescript-advanced-types`           | Generics, conditionals, mapped types      |
| `react-doctor`                        | Post-change React health check (0–100)    |
| `frontend-design`                     | High-quality production UI patterns       |
| `playwright-skill`                    | Full browser automation                   |
| `clerk-setup` / `clerk-orgs`          | Clerk auth setup, multi-tenant, RBAC      |
| `vercel-react-best-practices`         | React performance from Vercel Engineering |
| `web-design-guidelines`               | Accessibility, UX, best practices audit   |
| `code-simplifier`                     | Refactor for clarity and maintainability  |

## Module System

Business logic lives in `src/modules/<name>/`. Routes in `src/routes/` are thin adapters.
Each module requires a `manifest.ts` registered in `src/modules/core/registry.ts`.
See `src/modules/README.md` and the `module-architecture` skill for full rules.

## Auth System

Three modes via `AUTH_MODE` env: `local` (Better Auth), `clerk` (Clerk), `hybrid` (both).
Always use `useAppAuth()` hook — never raw Clerk/Better Auth hooks.
Bypass available for dev/E2E via `VITE_SKIP_AUTH=true` (localhost only).

## AI System

`src/modules/ai/` owns the full AI runtime: 5 providers (llama-cpp, ollama, lm-studio, openai, anthropic).
Active provider resolved from: `ia-config/` → env vars → `/api/ai/config-store`.
See `docs/ai/architecture.md` and the `ai-providers` skill.

## Skill Pairing Quick Reference

When working in a domain, load ALL applicable skills before generating code:

| Task                          | Load these skills                                            |
| ----------------------------- | ------------------------------------------------------------ |
| New module                    | `module-architecture` + `feature-crud` + `i18n-deep`         |
| Add CRUD to existing module   | `feature-crud` + `drizzle-db` + `i18n-deep`                  |
| New widget / fix widget       | `widget-system` + `i18n-deep`                                |
| AI providers / streaming      | `ai-providers` + `docker-ai-stack`                           |
| Auth / protected routes       | `auth-dual-provider`                                         |
| DB schema / migrations        | `drizzle-db`                                                 |
| Translations                  | `i18n-deep`                                                  |
| E2E tests                     | `e2e-testing-auth` + `playwright-skill`                      |
| Docker / local LLM            | `docker-ai-stack`                                            |
| UI component / accessibility  | `shadcn-first` + `frontend-design` + `web-design-guidelines` |
| New sheet / side-panel        | `crud-sheet`                                                 |
| Delete with toast confirm     | `toast-confirm-delete`                                       |
| Post-change quality check     | `react-doctor`                                               |
| Code cleanup / refactor       | `code-simplifier` + `vercel-react-best-practices`            |
| List / table with many rows   | `data-tables` + `i18n-deep`                                  |
| Refactor large view component | `data-tables` + `code-simplifier`                            |

Agents live in `.github/agents/`. Skills live in `.github/skills/` (`app/` = this repo, `vendor/` = 3rd party).
