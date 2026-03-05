import { type ColumnDef } from '@tanstack/react-table'
import { Check, X, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
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
import { useProjects } from '@/features/Projects/api/projects.queries'
import { useUsers } from '@/features/Users/api/users.queries'
import { useCurrentUser } from '@/features/Users/hooks/useCurrentUser'
import { toast } from '@/shared/lib/toast'
import { cn } from '@/shared/lib/utils'
import { DataTable } from '@/shared/ui/DataTable'
import {
  useCreateTransaction,
  useDeleteTransaction,
  useUpdateTransaction,
  useTransactions,
} from '../api/transactions.queries'
import type { Transaction } from '../model/types'
import { TransactionForm } from './TransactionForm'

interface PendingTransactionsTableProps {
  transactions: Transaction[]
  currentUserId: string | null
}

function PendingTransactionsTable({ transactions, currentUserId }: PendingTransactionsTableProps) {
  const { t } = useTranslation()
  const updateMutation = useUpdateTransaction()
  const { data: users = [] } = useUsers()

  const pendingTransactions = React.useMemo(() => {
    // Show all pending transactions for demo purposes
    // if (!currentUserId) return []
    // return transactions.filter((t) => t.status === 'Pending' && t.assignedAdminId === currentUserId)
    return transactions.filter((t) => t.status === 'Pending')
  }, [transactions])

  const handleApprove = (transaction: Transaction) => {
    if (!currentUserId) return
    if (confirm(t('transactions.pending.approveConfirm'))) {
      updateMutation.mutate(
        {
          id: transaction.id,
          data: {
            status: 'Approved',
            approvedBy: currentUserId,
            approvedAt: new Date().toISOString(),
          },
        },
        {
          onSuccess: () => toast.success(t('transactions.pending.approveSuccess')),
        },
      )
    }
  }

  const handleReject = (transaction: Transaction) => {
    if (!currentUserId) return
    const reason = prompt(t('transactions.pending.rejectPrompt'))
    if (reason) {
      updateMutation.mutate(
        {
          id: transaction.id,
          data: {
            status: 'Rejected',
            rejectionReason: reason,
            approvedBy: currentUserId,
            approvedAt: new Date().toISOString(),
          },
        },
        {
          onSuccess: () => toast.success(t('transactions.pending.rejectSuccess')),
        },
      )
    }
  }

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground">
          #{row.original.id?.slice(0, 8)}
        </span>
      ),
    },
    {
      accessorKey: 'customer.name',
      id: 'customer_name',
      header: t('transactions.table.customer'),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.customer.name}</span>
          <span className="text-xs text-muted-foreground">{row.original.customer.email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'amount',
      header: t('transactions.table.amount'),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('amount'))
        const isExpense = amount < 0
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(Math.abs(amount))

        return (
          <div
            className={cn(
              'font-semibold flex items-center gap-1',
              isExpense ? 'text-red-500' : 'text-emerald-500',
            )}
          >
            {isExpense ? '-' : '+'}
            {formatted}
          </div>
        )
      },
    },
    {
      accessorKey: 'userId',
      header: t('transactions.form.userLabel'),
      cell: ({ row }) => {
        const user = users.find((u) => u.id === row.original.userId)
        return user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm">{user.name}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">Unknown</span>
        )
      },
    },
    {
      accessorKey: 'date',
      header: t('transactions.table.date'),
      cell: ({ row }) => new Date(row.getValue('date')).toLocaleDateString(),
    },
    {
      id: 'actions',
      header: t('common.actions'),
      cell: ({ row }) => {
        const transaction = row.original
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
              onClick={() => handleApprove(transaction)}
            >
              <Check className="h-4 w-4" />
              <span className="sr-only">{t('transactions.pending.approve')}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
              onClick={() => handleReject(transaction)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">{t('transactions.pending.reject')}</span>
            </Button>
          </div>
        )
      },
    },
  ]

  if (pendingTransactions.length === 0) {
    return null
  }

  return (
    <div className="space-y-4 border rounded-xl p-4 bg-muted/30">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-orange-600">
          {t('transactions.pending.title')}
          <Badge variant="destructive" className="rounded-full px-2">
            {pendingTransactions.length}
          </Badge>
        </h3>
      </div>
      <DataTable columns={columns} data={pendingTransactions} className="max-h-[300px]" />
    </div>
  )
}

export function TransactionsPage() {
  const { t } = useTranslation()
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null)

  // We need to fetch all transactions to filter pending ones for the current user
  // In a real app, this would be a separate specific query
  const { data: allTransactions = [], isLoading, isError } = useTransactions()

  // Infinite scroll removed in favor of client-side role filtering
  // const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
  //   useInfiniteTransactions(10)

  const { data: users = [] } = useUsers()
  const { data: projects = [] } = useProjects()

  const { syncedUserId: currentUserId } = useCurrentUser()

  const displayedTransactions = React.useMemo(() => {
    // Show all transactions for demo purposes
    // if (!currentUserId) return []
    // if (userRole === 'admin') return allTransactions
    // return allTransactions.filter((t) => t.userId === currentUserId)
    return allTransactions
  }, [allTransactions])

  const createMutation = useCreateTransaction()
  const updateMutation = useUpdateTransaction()
  const deleteMutation = useDeleteTransaction()

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: 'customer.name',
      id: 'customer_name',
      header: t('transactions.table.customer'),
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.customer.name}</span>
          <span className="text-xs text-muted-foreground">{row.original.customer.email}</span>
        </div>
      ),
    },
    {
      accessorKey: 'userId',
      header: t('transactions.form.userLabel'),
      cell: ({ row }) => {
        const user = users.find((u) => u.id === row.original.userId)
        return user ? (
          <div className="flex items-center gap-2">
            <span className="text-sm">{user.name}</span>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">Unknown</span>
        )
      },
    },
    {
      accessorKey: 'projectId',
      header: t('transactions.form.projectLabel'),
      cell: ({ row }) => {
        const project = projects.find((p) => p.id === row.original.projectId)
        return project ? (
          <Badge variant="outline">{project.name}</Badge>
        ) : (
          <span className="text-muted-foreground text-xs">Unknown</span>
        )
      },
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
          Approved: t('transactions.form.statusApproved'),
          Pending: t('transactions.form.statusPending'),
          Rejected: t('transactions.form.statusRejected'),
        }
        return <Badge variant={variants[status] || 'outline'}>{labels[status] || status}</Badge>
      },
    },
    {
      accessorKey: 'amount',
      header: t('transactions.table.amount'),
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue('amount'))
        const isExpense = amount < 0
        const formatted = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        }).format(Math.abs(amount))

        return (
          <div
            className={cn(
              'font-semibold flex items-center gap-1',
              isExpense ? 'text-red-500' : 'text-emerald-500',
            )}
          >
            {isExpense ? '-' : '+'}
            {formatted}
          </div>
        )
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
              <DropdownMenuItem
                onClick={() => {
                  setEditingTransaction(transaction)
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => {
                  if (confirm(t('common.undoWarning'))) {
                    deleteMutation.mutate(transaction.id)
                  }
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
    return <div>{t('transactions.error.description')}</div>
  }

  return (
    <div className="flex flex-col h-full space-y-8">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-3xl font-bold tracking-tight">{t('transactions.title')}</h2>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('transactions.actions.create')}
        </Button>
      </div>

      {/* Pending Approval Section */}
      {currentUserId && (
        <div className="shrink-0">
          <PendingTransactionsTable transactions={allTransactions} currentUserId={currentUserId} />
        </div>
      )}

      <div className="flex-1 min-h-0 flex flex-col space-y-4">
        <h3 className="text-xl font-semibold tracking-tight shrink-0">
          {t('transactions.history')}
        </h3>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={displayedTransactions}
            filterColumn="customer_name"
            fullHeight
          />
        )}
      </div>

      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent>
          <SheetHeader className="shrink-0">
            <SheetTitle>{t('transactions.actions.create')}</SheetTitle>
            <SheetDescription>{t('transactions.form.createDescription')}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <TransactionForm
              onSubmit={(values) => {
                const { customer, ...rest } = values
                createMutation.mutate(
                  {
                    ...rest,
                    customerName: customer.name,
                    customerEmail: customer.email,
                  },
                  {
                    onSuccess: () => {
                      setIsCreateOpen(false)
                      toast.success(t('transactions.toast.created'))
                    },
                  },
                )
              }}
              onCancel={() => setIsCreateOpen(false)}
              isLoading={createMutation.isPending}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
      >
        <SheetContent>
          <SheetHeader className="shrink-0">
            <SheetTitle>{t('transactions.actions.edit')}</SheetTitle>
            <SheetDescription>{t('transactions.form.editDescription')}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {editingTransaction && (
              <TransactionForm
                defaultValues={editingTransaction}
                onSubmit={(values) => {
                  updateMutation.mutate(
                    { id: editingTransaction.id, data: values },
                    {
                      onSuccess: () => {
                        setEditingTransaction(null)
                        toast.success(t('transactions.toast.updated'))
                      },
                    },
                  )
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
