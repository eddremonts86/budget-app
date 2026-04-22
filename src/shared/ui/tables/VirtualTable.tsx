import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Loader2 } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/shared/lib/utils'
import { VIRTUAL_OVERSCAN, VIRTUAL_ROW_HEIGHT } from './constants'

interface VirtualTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onFetchNextPage: () => void
  /** Change this value to reset scroll to top (e.g. on filter/search change) */
  scrollResetKey?: string
  /** Override estimated row height (default: VIRTUAL_ROW_HEIGHT) */
  rowHeight?: number
  /** Override virtualizer overscan (default: VIRTUAL_OVERSCAN) */
  overscan?: number
  /** i18n key for "loading more" text (default: 'common.loadingMore') */
  loadingMoreKey?: string
  /** className for the table cell (default: 'py-3 px-6 text-sm border-b border-border/40 align-middle') */
  cellClassName?: string
}

export function VirtualTable<TData>({
  columns,
  data,
  hasNextPage,
  isFetchingNextPage,
  onFetchNextPage,
  scrollResetKey,
  rowHeight = VIRTUAL_ROW_HEIGHT,
  overscan = VIRTUAL_OVERSCAN,
  loadingMoreKey = 'common.loadingMore',
  cellClassName = 'py-3 px-6 text-sm border-b border-border/40 align-middle',
}: VirtualTableProps<TData>) {
  const { t } = useTranslation()
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Reset scroll position when data source changes (search/filter)
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0
    }
  }, [scrollResetKey])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const { rows } = table.getRowModel()

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    overscan,
  })

  // Trigger next page when last virtual item is near the end
  const virtualItems = rowVirtualizer.getVirtualItems()
  const lastItemIndex = virtualItems[virtualItems.length - 1]?.index ?? -1

  React.useEffect(() => {
    if (lastItemIndex >= rows.length - 1 && hasNextPage && !isFetchingNextPage) {
      onFetchNextPage()
    }
  }, [lastItemIndex, rows.length, hasNextPage, isFetchingNextPage, onFetchNextPage])

  return (
    <div
      className={cn(
        'rounded-3xl border border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden shadow-sm',
        'flex-1 min-h-0 flex flex-col',
      )}
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <Table className="border-separate border-spacing-0">
          <TableHeader className="sticky top-0 z-20 bg-secondary/95 backdrop-blur-md shadow-sm">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="h-12 text-xs font-bold uppercase tracking-wider text-muted-foreground/70 px-6 border-b border-border/40 sticky top-0 bg-inherit"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {/* Top spacer */}
            {virtualItems.length > 0 && virtualItems[0].start > 0 && (
              <tr>
                <td colSpan={columns.length} style={{ height: virtualItems[0].start }} />
              </tr>
            )}
            {virtualItems.map((virtualItem) => {
              const row = rows[virtualItem.index]
              return (
                <TableRow
                  key={row.id}
                  data-index={virtualItem.index}
                  ref={(node) => rowVirtualizer.measureElement(node)}
                  className="group hover:bg-secondary/10 transition-colors duration-200 cursor-default"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cellClassName}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              )
            })}
            {/* Bottom spacer */}
            {virtualItems.length > 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  style={{
                    height:
                      rowVirtualizer.getTotalSize() -
                      (virtualItems[virtualItems.length - 1].end ?? 0),
                  }}
                />
              </tr>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Loading indicator */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-3 shrink-0 border-t border-border/40">
          <div className="flex items-center gap-2 text-muted-foreground text-sm bg-secondary/20 px-5 py-2 rounded-2xl border border-border/40">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            {t(loadingMoreKey)}
          </div>
        </div>
      )}
    </div>
  )
}
