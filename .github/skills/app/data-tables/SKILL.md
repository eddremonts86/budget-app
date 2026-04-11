---
name: data-tables
description: 'Unified table system: VirtualTable, TableSearchBar, TableListStates, useDebouncedSearch, flattenInfinitePages. All shared primitives live in src/shared/ui/tables/. Use this skill when creating or refactoring any table, list, infinite scroll, or virtualized view. Covers: virtualization, search, infinite scroll, column definitions, Thin Orchestrator pattern, and DataTable/UnifiedDataTable for paginated tables.'
---

# Data Tables — Unified Skill

> Canonical source: `src/shared/ui/tables/` — shared primitives.
> Reference implementations: `src/modules/tasks/` and `src/modules/categories/` (virtualized infinite), `src/modules/users/` (virtualized infinite), `src/modules/analytics/` and `src/modules/settings/` (paginated DataTable).

---

## MANDATORY RULE

**ALL data tables in this project MUST use one of the two shared table systems:**

1. **`VirtualTable`** from `@/shared/ui/tables` — for large/infinite datasets
2. **`DataTable`** from `@/shared/ui/tables/DataTable` — for small/finite datasets with client-side sorting/pagination

**NEVER create a raw `<Table>` with manual `<TableRow>` mapping for data display.** Raw `<Table>` is only acceptable for static/layout tables that do not display dynamic data arrays.

When in doubt, use `DataTable` — it handles search, sorting, pagination, and empty states automatically.

---

## 1. Architecture Overview

The project has **two table systems** — choose based on data volume and fetch pattern:

| System                 | Component                        | When to use                                                 | Where                   |
| ---------------------- | -------------------------------- | ----------------------------------------------------------- | ----------------------- |
| **Virtual + Infinite** | `VirtualTable`                   | Large datasets with cursor/offset pagination                | `@/shared/ui/tables`    |
| **Paginated + Full**   | `UnifiedDataTable` / `DataTable` | Small datasets loaded at once, with sorting/grouping/export | `@/shared/ui/DataTable` |

### Shared primitives (always from `@/shared/ui/tables`)

| Export                      | Type      | Purpose                                   |
| --------------------------- | --------- | ----------------------------------------- |
| `VirtualTable<TData>`       | Component | Virtualized infinite scroll table         |
| `TableSearchBar`            | Component | Search input with counter + spinner       |
| `TableEmptyState`           | Component | Empty/no-results state                    |
| `TableErrorState`           | Component | Error with retry button                   |
| `TableSkeleton`             | Component | Loading skeleton                          |
| `useDebouncedSearch()`      | Hook      | Debounced search with min-chars threshold |
| `flattenInfinitePages<T>()` | Utility   | Deduplicate infinite query pages          |
| `DEFAULT_PAGE_SIZE`         | Constant  | 20                                        |
| `VIRTUAL_ROW_HEIGHT`        | Constant  | 52px                                      |
| `VIRTUAL_OVERSCAN`          | Constant  | 10                                        |
| `SEARCH_MIN_CHARS`          | Constant  | 2                                         |
| `SEARCH_DEBOUNCE_MS`        | Constant  | 300ms                                     |
| `DELETE_TOAST_DURATION`     | Constant  | 10,000ms                                  |

---

## 2. Thin Orchestrator Pattern

A view **NEVER** exceeds ~100 lines. Decompose into:

| Layer                         | Responsibility                                       | Example                                         |
| ----------------------------- | ---------------------------------------------------- | ----------------------------------------------- |
| **View (orchestrator)**       | Composes hooks + renders components. No logic.       | `ListView.tsx` (~75 lines)                      |
| **Custom hooks**              | Encapsulate state, effects, queries. 1 hook = 1 job. | `useInfinite<Entity>List`, `use<Entity>Columns` |
| **Presentational components** | Receive props, render UI. No side-effects.           | `VirtualTable`, `TableSearchBar`                |
| **Model / constants**         | Types, domain-specific constants.                    | `model/types.ts`                                |

### Folder structure

```
src/modules/<module>/
├── api/                    # Query hooks
├── hooks/
│   ├── useInfinite<Entity>List.ts
│   ├── use<Entity>Columns.tsx     # .tsx if JSX in cells
│   └── use<Entity>Actions.ts
├── model/
│   ├── types.ts
│   └── constants.ts               # Domain-specific only (status colors, etc.)
└── ui/
    ├── components/
    │   └── index.ts               # Domain-specific components (badges, etc.)
    └── views/
        └── ListView.tsx           # Thin orchestrator
```

**IMPORTANT**: Shared table constants (`DEFAULT_PAGE_SIZE`, `VIRTUAL_*`, `SEARCH_*`, `DELETE_TOAST_DURATION`) live in `@/shared/ui/tables`. Module `model/constants.ts` is only for domain-specific values (status colors, badge variants, etc.).

---

## 3. VirtualTable — Usage

```tsx
import {
  VirtualTable,
  TableSearchBar,
  TableEmptyState,
  TableErrorState,
  TableSkeleton,
} from '@/shared/ui/tables'

// In your Thin Orchestrator view:
;<VirtualTable
  columns={columns}
  data={items}
  hasNextPage={hasNextPage}
  isFetchingNextPage={isFetchingNextPage}
  onFetchNextPage={fetchNextPage}
  scrollResetKey={`${filter1}-${filter2}-${activeSearch}`}
  rowHeight={52} // optional override (default: 52)
  cellClassName="py-3 px-6 text-sm border-b border-border/40 align-middle" // optional override
/>
```

### Props

| Prop                 | Type                 | Default                | Purpose                               |
| -------------------- | -------------------- | ---------------------- | ------------------------------------- |
| `columns`            | `ColumnDef<TData>[]` | required               | TanStack Table column definitions     |
| `data`               | `TData[]`            | required               | Flattened array of items              |
| `hasNextPage`        | `boolean`            | required               | From infinite query                   |
| `isFetchingNextPage` | `boolean`            | required               | From infinite query                   |
| `onFetchNextPage`    | `() => void`         | required               | From infinite query                   |
| `scrollResetKey`     | `string`             | `undefined`            | Changes → scroll resets to top        |
| `rowHeight`          | `number`             | `52`                   | Estimated row height for virtualizer  |
| `overscan`           | `number`             | `10`                   | Extra rows to render outside viewport |
| `loadingMoreKey`     | `string`             | `'common.loadingMore'` | i18n key for loading text             |
| `cellClassName`      | `string`             | `'py-3 px-6...'`       | CSS class for table cells             |

### Internal mechanics

- **Load-more trigger**: Uses `lastItemIndex >= rows.length - 1` (primitive dependency, not array)
- **Scroll reset**: `useEffect` on `scrollResetKey` sets `scrollTop = 0`
- **Spacers**: Top/bottom `<tr>` spacers for virtual window positioning
- **getCoreRowModel only**: Server handles sorting/filtering/pagination

---

## 4. TableSearchBar — Usage

```tsx
<TableSearchBar
  searchInput={searchInput}
  onSearchChange={setSearchInput}
  onClear={clearSearch}
  loadedCount={items.length}
  totalCount={totalCount}
  showSpinner={isFetching && !isFetchingNextPage}
  placeholderKey="todos.searchPlaceholder" // optional i18n key
/>
```

Features: focus animation, rounded-2xl styling, clear X button, count / totalCount, loading spinner.

---

## 5. TableListStates — Usage

```tsx
// Error state
<TableErrorState
  titleKey="todos.error.title"
  descriptionKey="todos.error.description"
  retryKey="todos.error.retry"
/>

// Empty state (search vs no-data)
<TableEmptyState
  isSearchActive={!!activeSearch}
  onClearSearch={clearSearch}
  noResultsKey="todos.noSearchResults"
  noDataKey="todos.empty"
/>

// Skeleton
<TableSkeleton rows={3} />
```

All props are optional and default to `common.*` i18n keys.

---

## 6. useDebouncedSearch — Usage

```tsx
import { useDebouncedSearch } from '@/shared/ui/tables'

const { searchInput, setSearchInput, activeSearch, clearSearch } = useDebouncedSearch()
// activeSearch is undefined until input >= SEARCH_MIN_CHARS (2)

// With custom options:
const { activeSearch } = useDebouncedSearch({ minChars: 1, debounceMs: 500 })
```

---

## 7. flattenInfinitePages — Usage

```tsx
import { flattenInfinitePages } from '@/shared/ui/tables'
import type { Todo } from '../model/types'

const todos = React.useMemo(
  () => flattenInfinitePages<Todo>(query.data?.pages),
  [query.data?.pages],
)
```

Deduplicates by `id` across pages. Always specify the generic type parameter.

---

## 8. Complete Thin Orchestrator Example

```tsx
// src/modules/<module>/ui/views/ListView.tsx
import {
  TableEmptyState,
  TableErrorState,
  TableSearchBar,
  TableSkeleton,
  VirtualTable,
  useDebouncedSearch,
} from '@/shared/ui/tables'
import { useInfiniteEntityList } from '../../hooks/useInfiniteEntityList'
import { useEntityActions } from '../../hooks/useEntityActions'
import { useEntityColumns } from '../../hooks/useEntityColumns'

export function ListView({ onEdit }: { onEdit: (item: Entity) => void }) {
  const { handleEdit, handleDelete } = useEntityActions(onEdit)
  const { searchInput, setSearchInput, activeSearch, clearSearch } = useDebouncedSearch()
  const {
    items,
    totalCount,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    isError,
  } = useInfiniteEntityList({ search: activeSearch })
  const columns = useEntityColumns(handleEdit, handleDelete)

  if (isError) return <TableErrorState />
  if (isLoading) return <TableSkeleton />

  return (
    <div className="h-full flex flex-col gap-4">
      <TableSearchBar
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onClear={clearSearch}
        loadedCount={items.length}
        totalCount={totalCount}
        showSpinner={isFetching && !isFetchingNextPage}
      />
      {items.length > 0 ? (
        <VirtualTable
          columns={columns}
          data={items}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onFetchNextPage={fetchNextPage}
          scrollResetKey={activeSearch}
        />
      ) : (
        <TableEmptyState isSearchActive={!!activeSearch} onClearSearch={clearSearch} />
      )}
    </div>
  )
}
```

---

## 9. Column Definitions Hook (`.tsx`)

Always use `.tsx` extension when columns contain JSX cells:

```tsx
// src/modules/<module>/hooks/useEntityColumns.tsx
export function useEntityColumns(
  onEdit: (item: Entity) => void,
  onDelete: (item: Entity) => void,
): ColumnDef<Entity>[] {
  const { t } = useTranslation()

  return React.useMemo(
    () => [
      { accessorKey: 'name', header: t('entity.fields.name'), cell: ({ row }) => <span>...</span> },
      {
        id: 'actions',
        header: '',
        enableHiding: false,
        cell: ({ row }) => <DropdownMenu>...</DropdownMenu>,
      },
    ],
    [t, onEdit, onDelete],
  )
}
```

---

## 10. Client-Side vs Server-Side Filtering

| Pattern                     | When                          | Example                                                      |
| --------------------------- | ----------------------------- | ------------------------------------------------------------ |
| **Server-side** (debounced) | Backend supports search param | Tasks: `useDebouncedSearch()` + pass `activeSearch` to query |
| **Client-side** (immediate) | Backend has no search         | Categories: `filter(c => c.name.includes(search))` in view   |

For client-side: import `SEARCH_MIN_CHARS` from shared and filter in the view:

```tsx
const filtered = React.useMemo(() => {
  if (!activeSearch) return items
  return items.filter((i) => i.name.toLowerCase().includes(activeSearch.toLowerCase()))
}, [items, activeSearch])
```

Disable infinite fetch during client-side search: `hasNextPage={!activeSearch && hasNextPage}`

---

## 11. UnifiedDataTable (Paginated Tables)

For tables that load all data at once and need client-side sorting, grouping, pagination, and export:

```tsx
import { UnifiedDataTable } from '@/shared/ui/DataTable'

<UnifiedDataTable
  columns={columns}
  data={data}
  enableSelection={true}
  enableGrouping={true}
  enablePagination={true}
  enableExport={true}
  enableColumnVisibility={true}
  filters={[{ columnId: 'status', label: 'Status', type: 'select', options: [...] }]}
  bulkActions={[{ label: 'Delete', onClick: handleBulkDelete, variant: 'destructive' }]}
/>
```

The legacy `DataTable` wrapper disables most features — use `UnifiedDataTable` for new tables.

---

## 12. Common Errors & Solutions

| Error                                | Cause                                    | Solution                                                         |
| ------------------------------------ | ---------------------------------------- | ---------------------------------------------------------------- |
| Infinite fetch loop                  | `scrollTop` not reset on filter change   | Pass `scrollResetKey` that changes with filters                  |
| Effect fires every render            | Array (`virtualItems`) in useEffect deps | Use `lastItemIndex` (primitive) as dependency                    |
| Type error on `flattenInfinitePages` | Missing generic type parameter           | Always: `flattenInfinitePages<Todo>(pages)`                      |
| `useInView` sentinel always visible  | Sentinel outside scroll container        | **Don't use useInView** — use virtualizer trigger                |
| Duplicate items across pages         | Cursor pagination overlap                | `flattenInfinitePages` deduplicates by `id`                      |
| Query key thrashing (useUserMap)     | All assignee IDs in one key              | Incremental batch with `requestedRef` + `queryClient.fetchQuery` |

---

## 13. File Inventory

```
src/shared/ui/tables/
├── index.ts              # Barrel exports
├── constants.ts          # DEFAULT_PAGE_SIZE, VIRTUAL_*, SEARCH_*, DELETE_TOAST_DURATION
├── flattenPages.ts       # flattenInfinitePages<T>()
├── useDebouncedSearch.ts # useDebouncedSearch(options?)
├── VirtualTable.tsx      # VirtualTable<TData> component
├── TableSearchBar.tsx    # Search input with counter/spinner
├── TableListStates.tsx   # TableEmptyState, TableErrorState, TableSkeleton
└── DataTable.tsx         # UnifiedDataTable (paginated) + legacy DataTable wrapper
```

---

## 14. Reference Implementations

### VirtualTable (infinite scroll) — Tasks, Categories, Users

| Module     | View                              | Columns hook               | Data hook                                 | Notes                                  |
| ---------- | --------------------------------- | -------------------------- | ----------------------------------------- | -------------------------------------- |
| Tasks      | `ui/views/ListView.tsx`           | `useColumns.tsx`           | `useInfiniteTodoList.ts`                  | `rowHeight={64}`, custom cellClassName |
| Categories | `ui/views/CategoriesListView.tsx` | `useCategoryColumns.tsx`   | `useInfiniteCategoryList.ts`              | Default row height                     |
| Users      | `components/UserTable.tsx`        | `hooks/useUserColumns.tsx` | `api/users.queries.ts` (useInfiniteUsers) | Domain filter bar in UsersPage         |

All use: `flattenInfinitePages<T>()`, `VirtualTable`, `TableSearchBar`, `TableEmptyState`, `TableErrorState`, `TableSkeleton`.

### DataTable (paginated, client-side) — Analytics, AI Logs

| Module    | Component                           | Data source                                 | Notes                                                       |
| --------- | ----------------------------------- | ------------------------------------------- | ----------------------------------------------------------- |
| Analytics | `components/ProjectPerformance.tsx` | `projectPerformanceQueryOptions` (useQuery) | Inside `<Card>`, `filterColumn="name"`                      |
| AI Logs   | `settings/ui/AiLanguageAudit.tsx`   | Raw `useQuery` with 5s polling              | Inside `<Card>`, `filterColumn="query"`, `enablePagination` |

Both use: `DataTable` with `ColumnDef[]`, built-in search via `filterColumn`, and `emptyStateLabel` for empty states.
