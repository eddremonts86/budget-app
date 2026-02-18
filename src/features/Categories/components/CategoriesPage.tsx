import { type ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useInView } from 'react-intersection-observer'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full border"
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
        <code className="bg-muted px-1.5 py-0.5 rounded">{row.original.color}</code>
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
        <SheetContent className="sm:max-w-[540px]">
          <SheetHeader>
            <SheetTitle>{t('categories.add')}</SheetTitle>
            <SheetDescription>{t('categories.description.create')}</SheetDescription>
          </SheetHeader>
          <div className="py-6">
            <CategoryForm
              onSubmit={async (values) => {
                await createMutation.mutateAsync(values)
                setIsCreateOpen(false)
              }}
              onCancel={() => setIsCreateOpen(false)}
              isLoading={createMutation.isPending}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Sheet */}
      <Sheet open={!!editingCategory} onOpenChange={(open) => !open && setEditingCategory(null)}>
        <SheetContent className="sm:max-w-[540px]">
          <SheetHeader>
            <SheetTitle>{t('common.edit')}</SheetTitle>
            <SheetDescription>{t('categories.description.edit')}</SheetDescription>
          </SheetHeader>
          <div className="py-6">
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
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
