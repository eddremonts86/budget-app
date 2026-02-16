# Mock Server

Development mock server using json-server.

## Start

```bash
pnpm mocks:sync    # Sync category JSON files into db.json
pnpm ai:switch lmstudio  # Switch active AI provider and re-sync mocks
pnpm mock          # Only mock server
pnpm dev           # App + mock server together
```

`pnpm mock` and `pnpm dev:mock` run `mocks:sync` automatically before starting `json-server`.

## Available Endpoints

| Method | Endpoint   | Description     |
| ------ | ---------- | --------------- |
| GET    | /todos     | List all todos  |
| GET    | /todos/:id | Get single todo |
| POST   | /todos     | Create todo     |
| PATCH  | /todos/:id | Partial update  |
| PUT    | /todos/:id | Full update     |
| DELETE | /todos/:id | Delete todo     |

## Filters (query params)

- `?status=pending` - Filter by status
- `?priority=high` - Filter by priority
- `?_sort=createdAt&_order=desc` - Sort
- `?q=texto` - Full-text search
- `?_page=1&_limit=10` - Pagination

## Data

Category source files are kept in separate JSON files:

- `ai-settings.json`
- `app-knowledge.json`
- `audit-logs.json`
- `ai-config-store.json`

All source files are unified into `db.json` by `scripts/sync-mocks.ts`.

Edit category files whenever possible, then run `pnpm mocks:sync`.
Changes persist while the server is running.
