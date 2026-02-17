import { type ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useInView } from 'react-intersection-observer'
import { toast } from '@/shared/lib/toast'
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
  const { t } = useTranslation()
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
      header: t('transactions.table.customer'),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.customer.name}</span>
          <span className="text-xs text-muted-foreground">{row.original.customer.email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: t('transactions.table.status'),
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
          Approved: 'default',
          Pending: 'secondary',
          Rejected: 'destructive',
        }
        const labels: Record<string, string> = {
          Approved: t('transactions.status.approved'),
          Pending: t('transactions.status.pending'),
          Rejected: t('transactions.status.rejected'),
        }
        return <Badge variant={variants[status] || 'outline'}>{labels[status] || status}</Badge>
      },
    },
    {
      accessorKey: 'amount',
      header: t('transactions.table.amount'),
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
      header: t('transactions.table.date'),
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
                <span className="sr-only">{t('common.openMenu')}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setEditingTransaction(transaction)}>
                <Pencil className="mr-2 h-4 w-4" />
                {t('transactions.actions.edit')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  toast.error(t('transactions.confirm.delete'), {
                    description: t('common.undoWarning'),
                    action: {
                      label: t('common.delete'),
                      onClick: () => deleteMutation.mutate(transaction.id),
                    },
                    cancel: {
                      label: t('common.cancel'),
                      onClick: () => {},
                    },
                    duration: 10000,
                  })
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('transactions.actions.delete')}
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
            {t('transactions.error.title')}
          </h2>
          <p className="text-muted-foreground">{t('transactions.error.description')}</p>
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
          <h2 className="text-3xl font-bold tracking-tight">{t('transactions.title')}</h2>
          <p className="text-muted-foreground">
            {t('transactions.summary', {
              shown: allTransactions.length,
              total: totalCount,
            })}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('transactions.actions.add')}
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
                    {isFetchingNextPage ? t('common.loadingMore') : t('common.loadMore')}
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
            <SheetTitle>{t('transactions.actions.add')}</SheetTitle>
            <SheetDescription>{t('transactions.title')}</SheetDescription>
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
            <SheetTitle>{t('transactions.actions.edit')}</SheetTitle>
            <SheetDescription>{t('transactions.title')}</SheetDescription>
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
