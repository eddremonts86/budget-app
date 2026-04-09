import {
  type Cell,
  type ColumnDef,
  type ColumnFiltersState,
  type GroupingState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useDebounce } from '@uidotdev/usehooks'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  Download,
  Layers3,
  Search,
  SlidersHorizontal,
} from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useIsMobile } from '@/shared/hooks/use-mobile'
import { cn } from '@/shared/lib/utils'

export interface DataTableFilterConfig {
  columnId: string
  label: string
  type?: 'text' | 'select'
  placeholder?: string
  options?: Array<{ label: string; value: string }>
}

export interface DataTableBulkAction<TData> {
  label: string
  onClick: (rows: TData[]) => void
  variant?: React.ComponentProps<typeof Button>['variant']
}

interface UnifiedDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  filterColumn?: string
  filters?: DataTableFilterConfig[]
  bulkActions?: DataTableBulkAction<TData>[]
  children?: React.ReactNode
  className?: string
  fullHeight?: boolean
  enableSelection?: boolean
  enableGrouping?: boolean
  groupableColumns?: string[]
  enablePagination?: boolean
  pageSizeOptions?: number[]
  initialPageSize?: number
  enableExport?: boolean
  exportFileName?: string
  onExport?: (rows: TData[]) => void
  enableColumnVisibility?: boolean
  emptyStateLabel?: string
}

interface LegacyDataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  filterColumn?: string
  children?: React.ReactNode
  className?: string
  fullHeight?: boolean
}

function toHeaderLabel(header: unknown, fallback: string) {
  if (typeof header === 'string') return header
  return fallback
}

function normalizeCellValue(value: unknown) {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  if (value instanceof Date) return value.toISOString()
  return JSON.stringify(value)
}

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`
}

function downloadCsv(fileName: string, csvContent: string) {
  if (typeof window === 'undefined') return
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`
  document.body.append(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

const EMPTY_FILTERS: DataTableFilterConfig[] = []
const EMPTY_BULK_ACTIONS: never[] = []

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- React.memo loses generic type parameter
const RowCell = React.memo(function RowCell({ cell }: { cell: Cell<any, unknown> }) {
  if (cell.getIsGrouped()) {
    return (
      <Button
        variant="ghost"
        className="h-auto p-0 font-medium"
        onClick={cell.row.getToggleExpandedHandler()}
      >
        {cell.row.getIsExpanded() ? (
          <ChevronDown className="mr-2 h-4 w-4" />
        ) : (
          <ChevronRight className="mr-2 h-4 w-4" />
        )}
        {flexRender(cell.column.columnDef.cell, cell.getContext())}
        <span className="ml-2 text-xs text-muted-foreground">({cell.row.subRows.length})</span>
      </Button>
    )
  }
  if (cell.getIsAggregated()) {
    return flexRender(
      cell.column.columnDef.aggregatedCell ?? cell.column.columnDef.cell,
      cell.getContext(),
    )
  }
  if (cell.getIsPlaceholder()) return null
  return flexRender(cell.column.columnDef.cell, cell.getContext())
})

export function UnifiedDataTable<TData, TValue>({
  columns,
  data,
  filterColumn,
  filters = EMPTY_FILTERS,
  bulkActions = EMPTY_BULK_ACTIONS,
  children,
  className,
  fullHeight,
  enableSelection = true,
  enableGrouping = true,
  groupableColumns,
  enablePagination = true,
  pageSizeOptions = [10, 20, 50],
  initialPageSize = 10,
  enableExport = true,
  exportFileName = 'data-table-export.csv',
  onExport,
  enableColumnVisibility = true,
  emptyStateLabel = 'No se encontraron resultados',
}: UnifiedDataTableProps<TData, TValue>) {
  const isMobile = useIsMobile()
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [grouping, setGrouping] = React.useState<GroupingState>([])
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  })
  const [globalFilter, setGlobalFilter] = React.useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false)

  const selectionColumn = React.useMemo<ColumnDef<TData, TValue> | null>(() => {
    if (!enableSelection) return null
    return {
      id: '__select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && 'indeterminate')
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Seleccionar todas las filas"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Seleccionar fila"
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40,
    }
  }, [enableSelection])

  const mergedColumns = React.useMemo(
    () => (selectionColumn ? [selectionColumn, ...columns] : columns),
    [columns, selectionColumn],
  )

  const table = useReactTable({
    data,
    columns: mergedColumns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    onGroupingChange: setGrouping,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: enableSelection,
    autoResetPageIndex: false,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      rowSelection,
      grouping: enableGrouping ? grouping : [],
      pagination,
    },
  })

  const [searchValue, setSearchValue] = React.useState(
    (filterColumn ? (table.getColumn(filterColumn)?.getFilterValue() as string) : globalFilter) ??
      '',
  )
  const debouncedSearchValue = useDebounce(searchValue, 300)
  const hideableColumns = table
    .getAllLeafColumns()
    .filter((column) => enableColumnVisibility && column.getCanHide())
  const allGroupableColumns = table
    .getAllLeafColumns()
    .filter(
      (column) =>
        column.id !== '__select' &&
        (groupableColumns ? groupableColumns.includes(column.id) : column.getCanGroup()),
    )
  const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original)
  const hasFilterControls = Boolean(filterColumn) || filters.length > 0
  const showToolbar =
    hasFilterControls ||
    hideableColumns.length > 0 ||
    enableExport ||
    (enableGrouping && allGroupableColumns.length > 0)

  React.useEffect(() => {
    if (filterColumn) {
      table.getColumn(filterColumn)?.setFilterValue(debouncedSearchValue)
      return
    }
    setGlobalFilter(debouncedSearchValue)
  }, [debouncedSearchValue, filterColumn, setGlobalFilter, table])

  const handleExport = React.useCallback(() => {
    const rows =
      selectedRows.length > 0
        ? selectedRows
        : table.getFilteredRowModel().rows.map((row) => row.original)

    if (onExport) {
      onExport(rows)
      return
    }

    const exportColumns = table
      .getAllLeafColumns()
      .filter((column) => column.id !== '__select' && column.getIsVisible())
    const headers = exportColumns.map((column) =>
      escapeCsv(toHeaderLabel(column.columnDef.header, column.id)),
    )
    const body = rows.map((row) => {
      const rowModel = table.getCoreRowModel().rows.find((current) => current.original === row)
      const values = exportColumns.map((column) => {
        const value = rowModel
          ? rowModel.getValue(column.id)
          : (row as Record<string, unknown>)[column.id]
        return escapeCsv(normalizeCellValue(value))
      })
      return values.join(',')
    })

    downloadCsv(exportFileName, [headers.join(','), ...body].join('\n'))
  }, [exportFileName, onExport, selectedRows, table])

  const rowModel = enablePagination ? table.getRowModel() : table.getPrePaginationRowModel()
  const canPaginate =
    enablePagination && table.getFilteredRowModel().rows.length > pagination.pageSize

  return (
    <FieldGroup
      className={cn(
        'w-full space-y-6',
        fullHeight && 'h-full min-h-0 flex flex-col gap-6 space-y-0',
      )}
    >
      {selectedRows.length > 0 && bulkActions.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/40 bg-secondary/20 p-3">
          <span className="text-sm font-medium">{selectedRows.length} seleccionados</span>
          <div className="flex flex-wrap items-center gap-2">
            {bulkActions.map((action) => (
              <Button
                key={action.label}
                size="sm"
                variant={action.variant ?? 'secondary'}
                onClick={() => action.onClick(selectedRows)}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {showToolbar && (
        <div
          className={cn('flex flex-col gap-4 shrink-0', hasFilterControls && 'md:items-stretch')}
        >
          {hasFilterControls && (
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="relative w-full md:max-w-sm group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder={
                    filterColumn
                      ? `Buscar por ${filterColumn}...`
                      : 'Buscar en todas las columnas...'
                  }
                  value={searchValue}
                  onChange={(event) => setSearchValue(event.target.value)}
                  className="pl-10 h-11 bg-secondary/20 border-transparent focus:border-primary/30 focus:ring-4 focus:ring-primary/5 rounded-2xl transition-all"
                />
              </div>
              {filters.length > 0 && (
                <Button
                  variant="outline"
                  className="h-11 rounded-2xl border-dashed border-border/60"
                  onClick={() => setShowAdvancedFilters((current) => !current)}
                >
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filtros avanzados
                </Button>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            {enableGrouping && allGroupableColumns.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-11 px-4 gap-2 border-dashed border-border/60 hover:border-primary/30 rounded-2xl"
                  >
                    <Layers3 className="w-4 h-4" />
                    Agrupar
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 p-2 rounded-2xl shadow-2xl backdrop-blur-xl border-border/40"
                >
                  <DropdownMenuLabel>Agrupar por</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allGroupableColumns.map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      checked={grouping.includes(column.id)}
                      className="rounded-lg m-1"
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setGrouping((current) => [...current, column.id])
                          return
                        }
                        setGrouping((current) => current.filter((item) => item !== column.id))
                      }}
                    >
                      {toHeaderLabel(column.columnDef.header, column.id)}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {hideableColumns.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-11 px-4 gap-2 border-dashed border-border/60 hover:border-primary/30 rounded-2xl"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    Columnas
                    <ChevronDown className="w-4 h-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-48 p-2 rounded-2xl shadow-2xl backdrop-blur-xl border-border/40"
                >
                  {hideableColumns.map((column) => (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize rounded-lg m-1"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) => column.toggleVisibility(!!value)}
                    >
                      {column.id}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
            {enableExport && (
              <Button
                variant="outline"
                className="h-11 px-4 gap-2 border-dashed border-border/60 hover:border-primary/30 rounded-2xl"
                onClick={handleExport}
              >
                <Download className="w-4 h-4" />
                Exportar
              </Button>
            )}
          </div>
          {showAdvancedFilters && filters.length > 0 && (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filters.map((filter) => {
                const column = table.getColumn(filter.columnId)
                if (!column) return null

                if (filter.type === 'select') {
                  return (
                    <Select
                      key={filter.columnId}
                      value={(column.getFilterValue() as string) ?? 'all'}
                      onValueChange={(value) => {
                        if (value === 'all') {
                          column.setFilterValue(undefined)
                          return
                        }
                        column.setFilterValue(value)
                      }}
                    >
                      <SelectTrigger className="h-11 rounded-2xl bg-secondary/20 border-transparent">
                        <SelectValue placeholder={filter.label} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        {(filter.options ?? []).map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )
                }

                return (
                  <Input
                    key={filter.columnId}
                    value={(column.getFilterValue() as string) ?? ''}
                    onChange={(event) => column.setFilterValue(event.target.value)}
                    placeholder={filter.placeholder ?? `Filtrar por ${filter.label}`}
                    className="h-11 rounded-2xl bg-secondary/20 border-transparent"
                  />
                )
              })}
            </div>
          )}
        </div>
      )}

      <div
        className={cn(
          'rounded-3xl border border-border/40 bg-card/30 backdrop-blur-sm overflow-hidden shadow-sm',
          fullHeight && 'flex-1 min-h-0 flex flex-col',
        )}
      >
        {isMobile ? (
          <div
            className={cn(
              'space-y-3 overflow-y-auto p-4',
              className,
              fullHeight && 'flex-1 h-full',
            )}
          >
            {rowModel.rows.map((row) => (
              <div key={row.id} className="rounded-2xl border border-border/40 bg-card/80 p-4">
                <div className="space-y-3">
                  {row.getVisibleCells().map((cell) => (
                    <div key={cell.id} className="flex items-start justify-between gap-4">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {toHeaderLabel(cell.column.columnDef.header, cell.column.id)}
                      </span>
                      <div className="text-right text-sm">
                        <RowCell cell={cell} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {children}
            {!rowModel.rows.length && (
              <div className="h-32 flex flex-col items-center justify-center gap-2 text-muted-foreground rounded-2xl border border-border/40">
                <div className="p-3 rounded-full bg-secondary/30">
                  <Search className="w-6 h-6 opacity-20" />
                </div>
                <p className="font-medium">{emptyStateLabel}</p>
              </div>
            )}
          </div>
        ) : (
          <Table
            className="border-separate border-spacing-0"
            containerClassName={cn('overflow-y-auto', className, fullHeight && 'flex-1 h-full')}
          >
            <TableHeader className="sticky top-0 z-20 bg-secondary/95 backdrop-blur-md shadow-sm">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent border-none">
                  {headerGroup.headers.map((header) => {
                    const isSortable = header.column.getCanSort()
                    const sorted = header.column.getIsSorted()
                    return (
                      <TableHead
                        key={header.id}
                        className="h-12 text-xs font-bold uppercase tracking-wider text-muted-foreground/70 px-6 border-b border-border/40 sticky top-0 bg-inherit"
                      >
                        {header.isPlaceholder ? null : isSortable ? (
                          <Button
                            variant="ghost"
                            className="h-auto p-0 font-inherit text-inherit hover:bg-transparent"
                            onClick={header.column.getToggleSortingHandler()}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sorted === 'asc' ? (
                              <ChevronUp className="ml-1 h-3.5 w-3.5" />
                            ) : sorted === 'desc' ? (
                              <ChevronDown className="ml-1 h-3.5 w-3.5" />
                            ) : (
                              <ChevronsUpDown className="ml-1 h-3.5 w-3.5 opacity-50" />
                            )}
                          </Button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </TableHead>
                    )
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {rowModel.rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="group hover:bg-secondary/10 transition-colors duration-200 cursor-default"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="py-4 px-6 text-sm border-b border-border/40 align-top"
                    >
                      <RowCell cell={cell} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {children}
              {!rowModel.rows.length && (
                <TableRow>
                  <TableCell colSpan={mergedColumns.length} className="h-32 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <div className="p-3 rounded-full bg-secondary/30">
                        <Search className="w-6 h-6 opacity-20" />
                      </div>
                      <p className="font-medium">{emptyStateLabel}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
      {canPaginate && (
        <div className="flex flex-col gap-3 rounded-2xl border border-border/40 bg-card/30 p-3 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-muted-foreground">
            Mostrando {table.getRowModel().rows.length} de {table.getFilteredRowModel().rows.length}
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={String(pagination.pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger className="h-9 w-[120px] rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option} por página
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              variant="outline"
              className="h-9 w-9"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-20 text-center text-sm font-medium">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
            </span>
            <Button
              size="icon"
              variant="outline"
              className="h-9 w-9"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </FieldGroup>
  )
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterColumn,
  children,
  className,
  fullHeight,
}: LegacyDataTableProps<TData, TValue>) {
  return (
    <UnifiedDataTable
      columns={columns}
      data={data}
      filterColumn={filterColumn}
      className={className}
      fullHeight={fullHeight}
      enableSelection={false}
      enableGrouping={false}
      enablePagination={false}
      enableExport={false}
      enableColumnVisibility
      filters={[]}
      bulkActions={[]}
    >
      {children}
    </UnifiedDataTable>
  )
}
