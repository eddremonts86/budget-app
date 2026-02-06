# TanStack Template - Copilot Instructions

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
