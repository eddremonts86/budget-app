# Mock Server

Development mock server using json-server.

## Start

```bash
pnpm mock          # Only mock server
pnpm dev           # App + mock server together
```

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

Edit `db.json` to add/modify test data.
Changes persist while the server is running.
