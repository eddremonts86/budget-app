import { type ColumnDef } from '@tanstack/react-table'
import { useDebounce } from '@uidotdev/usehooks'
import { Calendar, Clock, Loader2, Search, Trash2, X } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useInView } from 'react-intersection-observer'
import { Button } from '@/components/ui/button'
import { Field, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DataTable } from '@/shared/ui/DataTable'
import { useInfiniteTodos } from '../../api/todos.queries'
import { useTodoActions } from '../../hooks/useTodoActions'
import { useUserMap } from '../../hooks/useUserMap'
import type { Todo } from '../../model/types'
import { TodoActionsMenu, TodoAssignee, TodoPriorityBadge, TodoStatusBadge } from '../components'

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Deduplicate todos across infinite pages (data can shift between fetches) */
function deduplicateTodos(pages: Array<{ data: unknown[] }> | undefined): Todo[] {
  const allItems = (pages?.flatMap((page) => page.data) ?? []) as Todo[]
  const seen = new Set<string>()
  return allItems.filter((todo) => {
    if (seen.has(todo.id)) return false
    seen.add(todo.id)
    return true
  })
}

// ── Component ────────────────────────────────────────────────────────────────

interface ListViewProps {
  onEdit: (todo: Todo) => void
  assignedTo?: string
  status?: string
  onTotalCountChange?: (count: number) => void
}

export function ListView({ onEdit, assignedTo, status, onTotalCountChange }: ListViewProps) {
  const { t } = useTranslation()
  const { canModify, handleEdit, handleDelete } = useTodoActions(onEdit)

  // Server-side search with debounce
  const [searchInput, setSearchInput] = React.useState('')
  const debouncedSearch = useDebounce(searchInput, 300)
  const activeSearch = debouncedSearch.length >= 2 ? debouncedSearch : undefined

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isFetching, isError } =
    useInfiniteTodos(
      5,
      status as Parameters<typeof useInfiniteTodos>[1],
      assignedTo,
      undefined,
      activeSearch,
    )

  const totalCount = data?.pages[0]?.totalCount ?? 0
  React.useEffect(() => {
    onTotalCountChange?.(totalCount)
  }, [totalCount, onTotalCountChange])

  const visibleTodos = React.useMemo(() => deduplicateTodos(data?.pages), [data])
  const userMap = useUserMap(visibleTodos)

  // Ref so columns don't re-create when users load
  const userMapRef = React.useRef(userMap)
  userMapRef.current = userMap

  // Infinite scroll trigger
  const { ref, inView } = useInView()
  const loadedPages = data?.pages.length ?? 0

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage && loadedPages < 50) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage, loadedPages])

  // ── Columns ──────────────────────────────────────────────────────────────

  const columns: ColumnDef<Todo>[] = React.useMemo(
    () => [
      {
        accessorKey: 'title',
        header: t('todos.table.title'),
        cell: ({ row }) => {
          const title = row.getValue('title') as string
          const dueDate = row.original.dueDate
          return (
            <div className="flex flex-col gap-1">
              <span className="font-semibold text-foreground leading-tight">{title}</span>
              {dueDate && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> {new Date(dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          )
        },
      },
      {
        accessorKey: 'status',
        header: t('todos.table.status'),
        cell: ({ row }) => <TodoStatusBadge status={row.getValue('status') as string} />,
      },
      {
        accessorKey: 'priority',
        header: t('todos.table.priority'),
        cell: ({ row }) => <TodoPriorityBadge priority={row.getValue('priority') as string} />,
      },
      {
        accessorKey: 'assignedTo',
        header: t('todos.table.assignedTo'),
        cell: ({ row }) => {
          const assignedId = row.getValue('assignedTo') as string | null
          return (
            <TodoAssignee assignee={assignedId ? userMapRef.current.get(assignedId) : undefined} />
          )
        },
      },
      {
        accessorKey: 'createdAt',
        header: t('todos.table.createdAt'),
        cell: ({ row }) => {
          const date = row.getValue('createdAt') as string
          return (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-3.5 h-3.5 opacity-50" />
              <span className="text-xs font-medium">
                {date ? new Date(date).toLocaleDateString() : '-'}
              </span>
            </div>
          )
        },
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const todo = row.original
          return (
            <TodoActionsMenu
              todo={todo}
              canModify={canModify(todo)}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          )
        },
      },
    ],
    [t, canModify, handleEdit, handleDelete],
  )

  // ── Early returns ────────────────────────────────────────────────────────

  if (isError) {
    return (
      <div className="flex items-center justify-center h-100 animate-in fade-in">
        <div className="text-center space-y-4 max-w-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">{t('todos.error.title')}</h2>
            <p className="text-muted-foreground text-sm">{t('todos.error.description')}</p>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            {t('todos.error.retry')}
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <FieldGroup className="space-y-4">
        <Skeleton className="h-11 w-full max-w-sm rounded-2xl" />
        <Skeleton className="h-16 w-full rounded-3xl" />
        <Skeleton className="h-16 w-full rounded-3xl" />
        <Skeleton className="h-16 w-full rounded-3xl" />
      </FieldGroup>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <TooltipProvider>
      <Field className="relative group h-full flex flex-col gap-4">
        {/* Server-side search bar */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative flex-1 min-w-0 md:max-w-sm group/search">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/search:text-primary transition-colors" />
            <Input
              placeholder={t('todos.searchPlaceholder', 'Search tasks...')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10 pr-10 h-11 bg-secondary/20 border-transparent focus:border-primary/30 focus:ring-4 focus:ring-primary/5 rounded-2xl transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="text-sm text-muted-foreground tabular-nums shrink-0">
            {isFetching && !isFetchingNextPage ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
            ) : (
              <span>
                {visibleTodos.length}
                {totalCount > visibleTodos.length && ` / ${totalCount}`}
              </span>
            )}
          </div>
        </div>

        {/* Data table (no client-side filterColumn — search is server-side) */}
        <DataTable columns={columns} data={visibleTodos} fullHeight>
          {hasNextPage && loadedPages < 50 && (
            <TableRow className="border-none hover:bg-transparent">
              <TableCell colSpan={columns.length} className="p-0">
                <div ref={ref} className="flex justify-center py-8">
                  <div className="flex items-center gap-2 text-muted-foreground font-medium bg-secondary/20 px-6 py-3 rounded-2xl backdrop-blur-sm border border-border/40">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    {t('todos.loadingMore')}
                  </div>
                </div>
              </TableCell>
            </TableRow>
          )}
        </DataTable>
      </Field>
    </TooltipProvider>
  )
}
