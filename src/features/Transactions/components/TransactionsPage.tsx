import { type ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import * as React from 'react'
import { useInView } from 'react-intersection-observer'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
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
  useCreateTransaction,
  useDeleteTransaction,
  useInfiniteTransactions,
  useUpdateTransaction,
} from '../api/transactions.queries'
import type { Transaction } from '../model/types'
import { TransactionForm } from './TransactionForm'

export function TransactionsPage() {
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteTransactions(10)

  const { ref, inView } = useInView()

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const createMutation = useCreateTransaction()
  const updateMutation = useUpdateTransaction()
  const deleteMutation = useDeleteTransaction()

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: 'customer.name',
      header: 'Customer',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.customer.name}</span>
          <span className="text-xs text-muted-foreground">{row.original.customer.email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
          Approved: 'default',
          Pending: 'secondary',
          Rejected: 'destructive',
        }
        return <Badge variant={variants[status] || 'outline'}>{status}</Badge>
      },
    },
    {
      accessorKey: 'amount',
      header: 'Amount',
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('amount'))
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(amount)
        return <div className="font-medium">{formatted}</div>
      },
    },
    {
      accessorKey: 'date',
      header: 'Date',
      cell: ({ row }) => new Date(row.getValue('date')).toLocaleDateString(),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const transaction = row.original

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
              <DropdownMenuItem onClick={() => setEditingTransaction(transaction)}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  toast.error('¿Estás seguro de eliminar esta transacción?', {
                    description: 'Esta acción no se puede deshacer.',
                    action: {
                      label: 'Eliminar',
                      onClick: () => deleteMutation.mutate(transaction.id),
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
          <p className="text-muted-foreground">Ocurrió un error al cargar las transacciones.</p>
        </div>
      </div>
    )
  }

  const allTransactions = data?.pages.flatMap((page) => page.data) ?? []
  const totalCount = data?.pages[0]?.totalCount ?? 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Transactions</h2>
          <p className="text-muted-foreground">
            Mostrando {allTransactions.length} de {totalCount} transacciones
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <DataTable columns={columns} data={allTransactions} filterColumn="customer_name">
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
            <SheetTitle>Create Transaction</SheetTitle>
            <SheetDescription>Add a new transaction record.</SheetDescription>
          </SheetHeader>
          <div className="py-6">
            <TransactionForm
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
      <Sheet
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
      >
        <SheetContent className="sm:max-w-[540px]">
          <SheetHeader>
            <SheetTitle>Edit Transaction</SheetTitle>
            <SheetDescription>Update transaction details.</SheetDescription>
          </SheetHeader>
          <div className="py-6">
            {editingTransaction && (
              <TransactionForm
                defaultValues={editingTransaction}
                onSubmit={async (values) => {
                  await updateMutation.mutateAsync({ id: editingTransaction.id, data: values })
                  setEditingTransaction(null)
                }}
                onCancel={() => setEditingTransaction(null)}
                isLoading={updateMutation.isPending}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
