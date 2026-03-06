import { type ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useInView } from 'react-intersection-observer'
import { Button } from '@/components/ui/button'
import { CrudSheetBody, CrudSheetContent, CrudSheetHeader } from '@/components/ui/crud-sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'
import { toast } from '@/shared/lib/toast'
import { DataTable } from '@/shared/ui/DataTable'
import {
  useCreateCategory,
  useDeleteCategory,
  useInfiniteCategories,
  useUpdateCategory,
} from '../api/categories.queries'
import type { Category } from '../model/types'
import { CategoryForm } from './CategoryForm'

export function CategoriesPage() {
  const { t } = useTranslation()
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteCategories(10)

  const { ref, inView } = useInView()

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const createMutation = useCreateCategory()
  const updateMutation = useUpdateCategory()
  const deleteMutation = useDeleteCategory()

  const columns: ColumnDef<Category>[] = [
    {
      accessorKey: 'name',
      header: t('categories.columns.name'),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div
            className="size-4 rounded border border-border/40 shadow-sm shrink-0"
            style={{ backgroundColor: row.original.color }}
          />
          <span className="font-medium">{row.original.name}</span>
        </div>
      ),
    },
    {
      accessorKey: 'color',
      header: t('categories.columns.color'),
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <div
            className="size-6 rounded-lg border border-border/50 shadow-sm shrink-0"
            style={{ backgroundColor: row.original.color }}
          />
          <code className="bg-muted/50 px-2 py-1 rounded-md text-xs font-mono border border-border/20">
            {row.original.color.toUpperCase()}
          </code>
        </div>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const category = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">{t('common.openMenu')}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                <Pencil className="mr-2 h-4 w-4" />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  toast.error(t('categories.confirm.delete'), {
                    description: t('common.undoWarning'),
                    action: {
                      label: t('common.delete'),
                      onClick: () => deleteMutation.mutate(category.id),
                    },
                    duration: 10000,
                  })
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  if (isError) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-destructive">
            {t('categories.error.title')}
          </h2>
          <p className="text-muted-foreground">{t('categories.error.description')}</p>
        </div>
      </div>
    )
  }

  const allCategories = data?.pages.flatMap((page) => page.data) ?? []
  const totalCount = data?.pages[0]?.totalCount ?? 0

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('categories.title')}</h2>
          <p className="text-muted-foreground">
            {t('categories.summary', {
              shown: allCategories.length,
              total: totalCount,
            })}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('categories.add')}
        </Button>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <DataTable columns={columns} data={allCategories} filterColumn="name" fullHeight>
            {hasNextPage && (
              <TableRow className="hover:bg-transparent border-none">
                <TableCell colSpan={columns.length} className="py-4">
                  <div ref={ref} className="flex justify-center">
                    <Button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      variant="outline"
                    >
                      {isFetchingNextPage ? t('common.loadingMore') : t('common.loadMore')}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </DataTable>
        )}
      </div>

      {/* Create Sheet */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <CrudSheetContent className="sm:max-w-[540px]">
          <CrudSheetHeader
            title={t('categories.add')}
            description={t('categories.description.create')}
            onClose={() => setIsCreateOpen(false)}
          />
          <CrudSheetBody className="p-6">
            <CategoryForm
              onSubmit={async (values) => {
                await createMutation.mutateAsync(values)
                setIsCreateOpen(false)
              }}
              onCancel={() => setIsCreateOpen(false)}
              isLoading={createMutation.isPending}
            />
          </CrudSheetBody>
        </CrudSheetContent>
      </Sheet>

      {/* Edit Sheet */}
      <Sheet open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <CrudSheetContent className="sm:max-w-[540px]">
          <CrudSheetHeader
            title={t('common.edit')}
            description={t('categories.description.edit')}
            onClose={() => setEditingCategory(null)}
          />
          <CrudSheetBody className="p-6">
            {editingCategory && (
              <CategoryForm
                defaultValues={editingCategory}
                onSubmit={async (values) => {
                  await updateMutation.mutateAsync({ id: editingCategory.id, data: values })
                  setEditingCategory(null)
                }}
                onCancel={() => setEditingCategory(null)}
                isLoading={updateMutation.isPending}
              />
            )}
          </CrudSheetBody>
        </CrudSheetContent>
      </Sheet>
    </div>
  )
}
