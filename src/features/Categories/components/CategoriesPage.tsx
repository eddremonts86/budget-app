import { type ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import * as React from 'react'
import { useInView } from 'react-intersection-observer'
import { toast } from 'sonner'
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
      header: 'Name',
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
      header: 'Color Code',
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
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setEditingCategory(category)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  toast.error('¿Estás seguro de eliminar esta categoría?', {
                    description: 'Esta acción no se puede deshacer.',
                    action: {
                      label: 'Eliminar',
                      onClick: () => deleteMutation.mutate(category.id),
                    },
                    cancel: {
                      label: 'Cancelar',
                      onClick: () => {},
                    },
                    duration: 10000,
                  })
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
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
          <h2 className="text-2xl font-bold tracking-tight text-destructive">Error</h2>
          <p className="text-muted-foreground">Ocurrió un error al cargar las categorías.</p>
        </div>
      </div>
    )
  }

  const allCategories = data?.pages.flatMap((page) => page.data) ?? []
  const totalCount = data?.pages[0]?.totalCount ?? 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Categories</h2>
          <p className="text-muted-foreground">
            Mostrando {allCategories.length} de {totalCount} categorías
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <DataTable columns={columns} data={allCategories} filterColumn="name">
          {hasNextPage && (
            <TableRow className="hover:bg-transparent border-none">
              <TableCell colSpan={columns.length} className="py-4">
                <div ref={ref} className="flex justify-center">
                  <Button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    variant="outline"
                  >
                    {isFetchingNextPage ? 'Loading more...' : 'Load More'}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          )}
        </DataTable>
      )}

      {/* Create Sheet */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="sm:max-w-[540px]">
          <SheetHeader>
            <SheetTitle>Create Category</SheetTitle>
            <SheetDescription>Add a new category for your transactions.</SheetDescription>
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
            <SheetTitle>Edit Category</SheetTitle>
            <SheetDescription>Update category details.</SheetDescription>
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
