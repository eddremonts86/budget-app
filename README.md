Welcome to your new TanStack app!

# Getting Started

To run this application:

```bash
npm install
npm run dev
```

## Run with Docker (one command)

This repository includes a full local stack in Docker Compose:

- App (TanStack Start / Vite) on `http://localhost:3000`
- Mock API (`json-server`) on `http://localhost:3001`
- ChromaDB on `http://localhost:8000`
- LM Studio headless (`llmster`) on `http://localhost:1234`

Start everything:

```bash
docker compose up --build
```

Or with pnpm:

```bash
pnpm docker:up
```

Full stack + automatic LM Studio model bootstrap:

```bash
pnpm docker:up:full
```

Verify all services and endpoints:

```bash
pnpm docker:check
```

Reset stack (keep data volumes):

```bash
pnpm docker:reset
```

Hard reset stack (remove named volumes, including LM Studio models):

```bash
pnpm docker:reset:hard
```

Stop everything:

```bash
docker compose down
```

Or with pnpm:

```bash
pnpm docker:down
```

### LM Studio first-time setup

The LM Studio container is included, but models are not pre-downloaded.
After the stack is running, download and load a model once:

```bash
docker compose exec lmstudio lms get google/gemma-3-1b
docker compose exec lmstudio lms load google/gemma-3-1b
```

You can then use `http://localhost:1234/v1` (or `http://lmstudio:1234/v1` inside Docker network) as your OpenAI-compatible base URL.

You can automate first-time model setup with:

```bash
pnpm docker:ai:init
```

Inspect LM Studio status/models:

```bash
pnpm docker:ai:status
```

Enable server-side CORS in LM Studio (`lms server start --cors`):

```bash
pnpm docker:ai:cors
```

Run an AI smoke test against app APIs (provider status + search probe):

```bash
pnpm docker:ai:smoke
```

Run an AI chat streaming smoke test (SSE):

```bash
pnpm docker:ai:smoke:chat
```

Run full verification (stack + search + chat smoke):

```bash
pnpm docker:verify
```

Download + load a specific model:

```bash
pnpm docker:ai:load
```

Optional custom model/identifier:

```bash
LMSTUDIO_MODEL=Qwen/Qwen2.5-Coder-7B-Instruct-GGUF LMSTUDIO_IDENTIFIER=local-model pnpm docker:ai:init
```

```bash
LMSTUDIO_MODEL=Qwen/Qwen2.5-Coder-7B-Instruct-GGUF LMSTUDIO_IDENTIFIER=local-model pnpm docker:ai:load
```

### LM Studio persistence and architecture

- Downloaded models and LM Studio state persist in a Docker volume (`lmstudio_data`).
- Default platform is `linux/amd64` (compatible on most hosts; Apple Silicon runs it via emulation).
- If you use a native ARM64 LM Studio image in the future, override `LMSTUDIO_PLATFORM` in your Docker env.

### Troubleshooting

- If AI endpoints fail (`/v1/models`), run `pnpm docker:ai:init` to download/load a model.
- If you see architecture warnings on Apple Silicon, this is expected with `linux/amd64` images.
- If a service fails, inspect logs with `pnpm docker:logs`.

# Building For Production

To build this application for production:

```bash
npm run build
```

## Testing

This project uses [Vitest](https://vitest.dev/) for testing. You can run the tests with:

```bash
npm run test
```

## Project Structure

This project follows a feature-based architecture and atomic design principles:

- `src/components/`: Reusable UI components.
  - `src/components/ui/`: Pure presentation components (shadcn/ui).
  - `src/components/composite/`: Complex components combining multiple UI elements.
  - `src/components/forms/`: Form-specific components.
- `src/features/`: Functional modules by domain (e.g., `Home`, `ToDo`). Each feature contains its own components, hooks, types, and API logic.
- `src/shared/`: Shared global resources.
  - `src/shared/lib/`: Core library configurations (API client, i18n, Query, Sentry).
  - `src/shared/providers/`: Global React context providers.
  - `src/shared/styles/`: Global styles and Tailwind configuration.
- `src/routes/`: File-based routing with TanStack Router.

## UI Components (shadcn/ui)

The project uses [shadcn/ui](https://ui.shadcn.com/) for its core component library. The following components have been implemented and customized:

- **Button**, **Badge**, **Card**, **Input**, **Textarea**, **Label**, **Select**, **Popover**, **Calendar**, **DatePicker**.

Customizations are handled via Tailwind CSS variables in `src/shared/styles/globals.css` using the OKLCH color space for better perceptual uniformity.

## Localization

Translations are managed in `src/shared/lib/i18n/locales`. Supported languages: English, Spanish, and Danish.

## Styling

This project uses Tailwind CSS 4 for styling, located in `src/shared/styles/globals.css`.

## Routing

This project uses [TanStack Router](https://tanstack.com/router). The initial setup is a file based router. Which means that the routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add another a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from '@tanstack/react-router'
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you use the `<Outlet />` component.

Here is an example layout that includes a header:

```tsx
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import { Link } from '@tanstack/react-router'

export const Route = createRootRoute({
  component: () => (
    <>
      <header>
        <nav>
          <Link to="/">Home</Link>
          <Link to="/about">About</Link>
        </nav>
      </header>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
})
```

The `<TanStackRouterDevtools />` component is not required so you can remove it if you don't want it in your layout.

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
const peopleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/people',
  loader: async () => {
    const response = await fetch('https://swapi.dev/api/people')
    return response.json() as Promise<{
      results: {
        name: string
      }[]
    }>
  },
  component: () => {
    const data = peopleRoute.useLoaderData()
    return (
      <ul>
        {data.results.map((person) => (
          <li key={person.name}>{person.name}</li>
        ))}
      </ul>
    )
  },
})
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).

### React-Query

React-Query is an excellent addition or alternative to route loading and integrating it into you application is a breeze.

First add your dependencies:

```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

Next we'll need to create a query client and provider. We recommend putting those in `main.tsx`.

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ...

const queryClient = new QueryClient()

// ...

if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)

  root.render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
}
```

You can also add TanStack Query Devtools to the root route (optional).

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <ReactQueryDevtools buttonPosition="top-right" />
      <TanStackRouterDevtools />
    </>
  ),
})
```

Now you can use `useQuery` to fetch your data.

```tsx
import { useQuery } from '@tanstack/react-query'

import './App.css'

function App() {
  const { data } = useQuery({
    queryKey: ['people'],
    queryFn: () =>
      fetch('https://swapi.dev/api/people')
        .then((res) => res.json())
        .then((data) => data.results as { name: string }[]),
    initialData: [],
  })

  return (
    <div>
      <ul>
        {data.map((person) => (
          <li key={person.name}>{person.name}</li>
        ))}
      </ul>
    </div>
  )
}

export default App
```

You can find out everything you need to know on how to use React-Query in the [React-Query documentation](https://tanstack.com/query/latest/docs/framework/react/overview).

## State Management

Another common requirement for React applications is state management. There are many options for state management in React. TanStack Store provides a great starting point for your project.

First you need to add TanStack Store as a dependency:

```bash
npm install @tanstack/store
```

Now let's create a simple counter in the `src/App.tsx` file as a demonstration.

```tsx
import { useStore } from '@tanstack/react-store'
import { Store } from '@tanstack/store'
import './App.css'

const countStore = new Store(0)

function App() {
  const count = useStore(countStore)
  return (
    <div>
      <button onClick={() => countStore.setState((n) => n + 1)}>Increment - {count}</button>
    </div>
  )
}

export default App
```

One of the many nice features of TanStack Store is the ability to derive state from other state. That derived state will update when the base state updates.

Let's check this out by doubling the count using derived state.

```tsx
import { useStore } from '@tanstack/react-store'
import { Store, Derived } from '@tanstack/store'
import './App.css'

const countStore = new Store(0)

const doubledStore = new Derived({
  fn: () => countStore.state * 2,
  deps: [countStore],
})
doubledStore.mount()

function App() {
  const count = useStore(countStore)
  const doubledCount = useStore(doubledStore)

  return (
    <div>
      <button onClick={() => countStore.setState((n) => n + 1)}>Increment - {count}</button>
      <div>Doubled - {doubledCount}</div>
    </div>
  )
}

export default App
```

We use the `Derived` class to create a new store that is derived from another store. The `Derived` class has a `mount` method that will start the derived store updating.

Once we've created the derived store we can use it in the `App` component just like we would any other store using the `useStore` hook.

You can find out everything you need to know on how to use TanStack Store in the [TanStack Store documentation](https://tanstack.com/store/latest).

# Demo files

Files prefixed with `demo` can be safely deleted. They are there to provide a starting point for you to play around with the features you've installed.

# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).
