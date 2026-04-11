---
name: list-virtualization
description: 'Patrones de virtualización, infinite scroll y descomposición de vistas lista/tabla. Usar cuando se cree o refactorice un ListView, tabla con muchos datos, infinite scroll, useVirtualizer, useReactTable, o se descomponga un componente grande en hooks y componentes presentacionales. Cubre: VirtualTodoTable, scroll reset, load-more trigger, useUserMap incremental fetch, useDebouncedSearch, useTodoColumns, columnas TanStack Table, y el patrón Thin Orchestrator View. Referencia: src/modules/tasks/.'
---

# List Virtualization & Component Decomposition Skill

> Referencia canónica: `src/modules/tasks/` — el módulo más completo del proyecto.

---

## 1. Principio: Divide y Vencerás

Un componente de vista **NUNCA** debe superar ~100 líneas. Si crece, descomponer en:

| Capa                          | Responsabilidad                                                     | Ejemplo en tasks                                              |
| ----------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------- |
| **View (orchestrator)**       | Compone hooks + renderiza componentes. Sin lógica.                  | `ListView.tsx` (~75 líneas)                                   |
| **Custom hooks**              | Encapsulan estado, efectos, queries. Un hook = una responsabilidad. | `useDebouncedSearch`, `useInfiniteTodoList`, `useTodoColumns` |
| **Presentational components** | Reciben props, renderizan UI. Sin side-effects.                     | `TodoStatusBadge`, `TodoAssignee`, `VirtualTodoTable`         |
| **Model / constants**         | Tipos, constantes mágicas centralizadas.                            | `model/types.ts`, `model/constants.ts`                        |

### Estructura de carpetas (patrón obligatorio)

```
src/modules/<module>/
├── api/              # Query hooks (useTQuery, useTQInfinite, mutations)
├── hooks/            # Custom hooks de lógica
│   ├── useDebouncedSearch.ts
│   ├── useInfinite<Entity>List.ts
│   ├── use<Entity>Columns.tsx      # ← .tsx si contiene JSX
│   ├── use<Entity>Actions.ts
│   └── useUserMap.ts               # Incremental batch fetching
├── model/
│   ├── types.ts
│   └── constants.ts                # PAGE_SIZE, DEBOUNCE_MS, VIRTUAL_*, etc.
├── ui/
│   ├── components/
│   │   ├── index.ts                # Barrel (re-exports públicos)
│   │   ├── Virtual<Entity>Table.tsx
│   │   ├── <Entity>SearchBar.tsx
│   │   ├── <Entity>ListStates.tsx  # Empty, Error, Skeleton
│   │   ├── <Entity>StatusBadge.tsx
│   │   ├── <Entity>PriorityBadge.tsx
│   │   ├── <Entity>Assignee.tsx
│   │   └── <Entity>ActionsMenu.tsx
│   └── views/
│       ├── ListView.tsx            # Thin orchestrator
│       ├── KanbanView.tsx          # Orchestrator para kanban
│       └── KanbanBoard.tsx         # Presentational board + DnD
```

### Regla de archivos .tsx vs .ts

- Si el hook **contiene JSX** (ej. `useTodoColumns` retorna `ColumnDef` con celdas JSX) → extensión **`.tsx`**
- Si el hook solo tiene lógica (state, effects, queries) → extensión **`.ts`**
- Error común: esbuild falla con "JSX in .ts file". Siempre verificar.

---

## 2. Thin Orchestrator View (patrón ListView)

La vista es un orquestador fino que conecta hooks con componentes:

```tsx
// src/modules/<module>/ui/views/ListView.tsx  (~75 líneas máximo)
export function ListView({ onEdit, assignedTo, status, onTotalCountChange }: ListViewProps) {
  // 1. Hooks de lógica
  const { canModify, handleEdit, handleDelete } = use<Entity>Actions(onEdit)
  const { searchInput, setSearchInput, activeSearch, clearSearch } = useDebouncedSearch()

  // 2. Hook de datos (infinite query + flatten + dedup)
  const {
    items, totalCount, fetchNextPage, hasNextPage, isFetchingNextPage,
    isLoading, isFetching, isError,
  } = useInfinite<Entity>List({ status, assignedTo, search: activeSearch, onTotalCountChange })

  // 3. Datos derivados
  const userMap = useUserMap(items)
  const columns = use<Entity>Columns(userMap, canModify, handleEdit, handleDelete)

  // 4. Early returns para estados
  if (isError) return <<Entity>ListErrorState />
  if (isLoading) return <<Entity>ListSkeleton />

  // 5. Renderizado — solo composición
  return (
    <TooltipProvider>
      <div className="h-full flex flex-col gap-4">
        <<Entity>SearchBar ...props />
        {items.length > 0 ? (
          <Virtual<Entity>Table
            columns={columns}
            data={items}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onFetchNextPage={fetchNextPage}
            scrollResetKey={`${assignedTo}-${status}-${activeSearch}`}
          />
        ) : (
          <<Entity>ListEmptyState isSearchActive={!!activeSearch} onClearSearch={clearSearch} />
        )}
      </div>
    </TooltipProvider>
  )
}
```

---

## 3. VirtualTodoTable — Componente de tabla virtualizado

### Dependencias

```bash
@tanstack/react-table    # useReactTable, flexRender, getCoreRowModel
@tanstack/react-virtual  # useVirtualizer
```

### Implementación canónica

```tsx
// src/modules/<module>/ui/components/Virtual<Entity>Table.tsx

interface VirtualTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onFetchNextPage: () => void
  scrollResetKey?: string  // Cambiar para resetear scroll al top
}

export function VirtualTable<TData>({ columns, data, ... }: VirtualTableProps<TData>) {
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // ── Reset scroll cuando cambian filtros/búsqueda ──
  React.useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0
  }, [scrollResetKey])

  // ── React Table (minimal — solo getCoreRowModel) ──
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })
  const { rows } = table.getRowModel()

  // ── Virtualizer ──
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => VIRTUAL_ROW_HEIGHT,  // 64px
    overscan: VIRTUAL_OVERSCAN,              // 10
  })

  // ── Load-more trigger (CRÍTICO) ──
  const virtualItems = rowVirtualizer.getVirtualItems()
  const lastItemIndex = virtualItems[virtualItems.length - 1]?.index ?? -1

  React.useEffect(() => {
    if (lastItemIndex >= rows.length - 1 && hasNextPage && !isFetchingNextPage) {
      onFetchNextPage()
    }
  }, [lastItemIndex, rows.length, hasNextPage, isFetchingNextPage, onFetchNextPage])

  // ── Render ──
  return (
    <div className="flex-1 min-h-0 flex flex-col rounded-3xl border ...">
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <Table>
          <TableHeader className="sticky top-0 z-20 bg-secondary/95 backdrop-blur-md">
            {/* ... headers ... */}
          </TableHeader>
          <TableBody>
            {/* Top spacer */}
            {virtualItems.length > 0 && virtualItems[0].start > 0 && (
              <tr><td colSpan={columns.length} style={{ height: virtualItems[0].start }} /></tr>
            )}
            {/* Virtual rows */}
            {virtualItems.map((vi) => {
              const row = rows[vi.index]
              return (
                <TableRow
                  key={row.id}
                  data-index={vi.index}
                  ref={(node) => rowVirtualizer.measureElement(node)}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
            {/* Bottom spacer */}
            {virtualItems.length > 0 && (
              <tr>
                <td colSpan={columns.length}
                  style={{ height: rowVirtualizer.getTotalSize() - (virtualItems.at(-1)?.end ?? 0) }}
                />
              </tr>
            )}
          </TableBody>
        </Table>
      </div>
      {/* Loading indicator */}
      {isFetchingNextPage && <LoadingBar />}
    </div>
  )
}
```

### Errores comunes y soluciones

| Error                              | Causa                                                                        | Solución                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Infinite fetch loop                | `scrollTop` no se resetea al cambiar filtros → virtualizer ve el último item | Usar `scrollResetKey` prop + `useEffect` para resetear scroll         |
| Effect se dispara en cada render   | `virtualItems` (array) como dependencia del effect                           | Usar `lastItemIndex` (número primitivo) como dependencia              |
| useInView sentinel siempre visible | Sentinel `<div>` fuera del scroll container                                  | **NO usar useInView**. Usar trigger del virtualizer                   |
| Datos duplicados entre páginas     | Paginación cursor-based puede solapar                                        | `flattenPages()` con `Set<string>` para deduplicar por ID             |
| Query key thrashing (useUserMap)   | Todas las assignee IDs en un solo query key que cambia cada página           | Incremental batch fetch con `requestedRef` + `queryClient.fetchQuery` |

---

## 4. Constantes centralizadas (model/constants.ts)

**SIEMPRE** extraer números mágicos a constantes con nombre:

```ts
// src/modules/<module>/model/constants.ts
export const LIST_PAGE_SIZE = 30
export const SEARCH_MIN_CHARS = 2
export const SEARCH_DEBOUNCE_MS = 300
export const VIRTUAL_ROW_HEIGHT = 64 // px — estimateSize para useVirtualizer
export const VIRTUAL_OVERSCAN = 10 // filas extra renderizadas fuera de viewport
```

---

## 5. Hook: useDebouncedSearch

```ts
// src/modules/<module>/hooks/useDebouncedSearch.ts
import { useDebounce } from '@uidotdev/usehooks'
import { SEARCH_DEBOUNCE_MS, SEARCH_MIN_CHARS } from '../model/constants'

export function useDebouncedSearch() {
  const [searchInput, setSearchInput] = React.useState('')
  const debouncedSearch = useDebounce(searchInput, SEARCH_DEBOUNCE_MS)
  const activeSearch = debouncedSearch.length >= SEARCH_MIN_CHARS ? debouncedSearch : undefined

  const clearSearch = React.useCallback(() => setSearchInput(''), [])

  return { searchInput, setSearchInput, activeSearch, clearSearch }
}
```

**Regla**: `activeSearch` es `undefined` (no `''`) cuando no hay búsqueda activa. Esto permite que la query se desactive con `enabled: !!search`.

---

## 6. Hook: useInfinite<Entity>List

```ts
// src/modules/<module>/hooks/useInfinite<Entity>List.ts
function flattenPages(pages: Array<{ data: unknown[] }> | undefined): Entity[] {
  if (!pages) return []
  const seen = new Set<string>()
  const result: Entity[] = []
  for (const page of pages) {
    for (const item of page.data as Entity[]) {
      if (!seen.has(item.id)) {
        seen.add(item.id)
        result.push(item)
      }
    }
  }
  return result
}

export function useInfiniteEntityList({ status, assignedTo, search, onTotalCountChange }) {
  const query = useInfiniteEntities(LIST_PAGE_SIZE, status, assignedTo, undefined, search)
  const totalCount = query.data?.pages[0]?.totalCount ?? 0
  const items = React.useMemo(() => flattenPages(query.data?.pages), [query.data?.pages])

  React.useEffect(() => {
    onTotalCountChange?.(totalCount)
  }, [totalCount, onTotalCountChange])

  return {
    items,
    totalCount,
    ...pick(
      query,
      'fetchNextPage',
      'hasNextPage',
      'isFetchingNextPage',
      'isLoading',
      'isFetching',
      'isError',
    ),
  }
}
```

---

## 7. Hook: useUserMap (Incremental Batch Fetch)

> **Problema**: En infinite scroll, cada página nueva añade IDs de usuario. Si todos los IDs van a un solo query key, éste cambia en cada página → la query anterior se abandona antes de completarse → los datos nunca llegan.

```ts
export function useUserMap(items: HasAssignedTo[]): Map<string, UserInfo> {
  const queryClient = useQueryClient()
  const [userMap, setUserMap] = React.useState<Map<string, UserInfo>>(new Map())
  const requestedRef = React.useRef(new Set<string>())

  const assigneeIds = React.useMemo(
    () => [...new Set(items.map((i) => i.assignedTo).filter(Boolean) as string[])],
    [items],
  )

  React.useEffect(() => {
    const newIds = assigneeIds.filter((id) => !requestedRef.current.has(id))
    if (newIds.length === 0) return

    newIds.forEach((id) => requestedRef.current.add(id))

    queryClient
      .fetchQuery({
        queryKey: userKeys.byIds(newIds.sort()),
        queryFn: () => fetchUsersByIds(newIds),
        staleTime: 5 * 60 * 1000,
      })
      .then((users) => {
        setUserMap((prev) => {
          const next = new Map(prev)
          users.forEach((u) => next.set(u.id, { name: u.name, avatar: u.avatar }))
          return next
        })
      })
  }, [assigneeIds, queryClient])

  return userMap
}
```

### Claves del patrón

1. **`requestedRef`** — Tracks already-fetched IDs. Prevents re-fetching on re-render.
2. **`queryClient.fetchQuery`** — Fires imperatively, doesn't change query keys reactively.
3. **`setUserMap(prev => new Map(prev))`** — Accumulates, never resets.
4. **`staleTime: 5min`** — Avoids re-fetching recently loaded users.

---

## 8. Hook: use<Entity>Columns (.tsx)

```tsx
// IMPORTANTE: extensión .tsx por contener JSX en las celdas
export function useTodoColumns(
  userMap: Map<string, UserInfo>,
  canModify: (todo: Todo) => boolean,
  onEdit: (todo: Todo) => void,
  onDelete: (todo: Todo) => void,
): ColumnDef<Todo>[] {
  const { t } = useTranslation()

  return React.useMemo(
    () => [
      {
        accessorKey: 'title',
        header: t('todos.fields.title'),
        cell: ({ row }) => (
          <div>
            <p className="font-medium">{row.original.title}</p>
            {row.original.dueDate && <span className="text-xs text-muted-foreground">...</span>}
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: t('todos.fields.status'),
        cell: ({ row }) => <TodoStatusBadge status={row.original.status} />,
      },
      // ... priority, assignedTo, createdAt, actions
    ],
    [t, userMap, canModify, onEdit, onDelete],
  )
}
```

---

## 9. Componentes de estado (Empty, Error, Skeleton)

Siempre crear un archivo `<Entity>ListStates.tsx` con tres exports:

```tsx
// TodoListEmptyState — condicionado a si hay búsqueda activa
export function TodoListEmptyState({ isSearchActive, onClearSearch }: Props) { ... }

// TodoListErrorState — botón de retry con window.location.reload()
export function TodoListErrorState() { ... }

// TodoListSkeleton — 4 <Skeleton> elements simulando la tabla
export function TodoListSkeleton() { ... }
```

---

## 10. Componentes de badges (presentacionales puros)

Patrón: Shadcn `<Badge variant="outline">` + variantes de estilo por valor:

```tsx
<Badge
  variant="outline"
  className={cn('gap-1 font-medium border-0', PRIORITY_BADGE_VARIANTS[priority])}
>
  <Flag className="w-3 h-3" />
  {labels[priority] ?? priority}
</Badge>
```

Variantes en `model/constants.ts`:

```ts
export const STATUS_BADGE_VARIANTS: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-500',
  in_progress: 'bg-blue-500/10 text-blue-500',
  completed: 'bg-emerald-500/10 text-emerald-500',
  // ...
}
```

---

## 11. Patrón Kanban: useVirtualizer por columna

Cada columna kanban tiene su propio virtualizer:

```tsx
function KanbanColumn({ todos, hasNextPage, isFetchingNextPage, onFetchNextPage }) {
  const parentRef = React.useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: todos.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 140, // card height ~140px
    overscan: 5,
  })
  // Mismo patrón de load-more trigger
}
```

**Diferencia key**: Kanban usa `estimateSize: 140` (cards) vs Table usa `estimateSize: 64` (rows).

---

## 12. Checklist de implementación

Cuando se cree un ListView para cualquier módulo:

- [ ] Crear `model/constants.ts` con `PAGE_SIZE`, `SEARCH_*`, `VIRTUAL_*`
- [ ] Crear `hooks/useDebouncedSearch.ts`
- [ ] Crear `hooks/useInfinite<Entity>List.ts` con `flattenPages` + dedup
- [ ] Crear `hooks/use<Entity>Columns.tsx` (nota: `.tsx`)
- [ ] Crear `hooks/useUserMap.ts` si hay assignees/user references
- [ ] Crear `ui/components/Virtual<Entity>Table.tsx` con virtualizer
- [ ] Crear `ui/components/<Entity>SearchBar.tsx`
- [ ] Crear `ui/components/<Entity>ListStates.tsx` (Empty, Error, Skeleton)
- [ ] Crear presentational badges si hay status/priority
- [ ] Actualizar barrel `ui/components/index.ts`
- [ ] Reescribir `ui/views/ListView.tsx` como Thin Orchestrator (~75 líneas)
- [ ] Pasar `scrollResetKey` combinando todos los filtros activos
- [ ] Verificar en navegador: virtualización (DOM rows < total), no infinite loop
- [ ] Probar: scroll → load more (1 page), cambiar filtro → reset scroll, buscar → filtrar

---

## 13. Anti-patterns (PROHIBIDO)

| Anti-pattern                                                 | Por qué                                                             | Alternativa                                       |
| ------------------------------------------------------------ | ------------------------------------------------------------------- | ------------------------------------------------- |
| `useInView` / intersection observer para load-more en tablas | El sentinel puede estar fuera del scroll container → infinite fetch | Trigger basado en `lastItemIndex` del virtualizer |
| Array completo como dep del useEffect (`virtualItems`)       | Crea nueva referencia cada render → effect se dispara infinitamente | Usar valor primitivo derivado (`lastItemIndex`)   |
| Todas las IDs de usuario en un solo query key                | Cambia en cada página → perpetuamente `pending`                     | Incremental batch fetch con `requestedRef`        |
| Componente de vista > 100 líneas                             | Inmantenible, imposible de testear                                  | Thin Orchestrator + hooks + presentational        |
| Números mágicos inline (`pageSize: 30`)                      | Difícil mantener, prone a inconsistencias                           | `model/constants.ts` con exports nombrados        |
| `useReactTable` con sorting/filtering/pagination models      | Innecesario cuando es server-side                                   | Solo `getCoreRowModel()` — mínimo                 |
