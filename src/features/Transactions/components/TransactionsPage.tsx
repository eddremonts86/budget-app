import { type ColumnDef } from '@tanstack/react-table'
import { Check, X, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useProjects } from '@/features/Projects/api/projects.queries'
import { useUsers } from '@/features/Users/api/users.queries'
import { useCurrentUser } from '@/features/Users/hooks/useCurrentUser'
import { toast } from '@/shared/lib/toast'
import { cn } from '@/shared/lib/utils'
import { DataTable, UnifiedDataTable, type DataTableBulkAction } from '@/shared/ui/DataTable'
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
    toast.warning(t('transactions.pending.approveConfirm'), {
      action: {
        label: t('transactions.pending.approve'),
        onClick: () => {
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
        },
      },
    })
  }

  const handleReject = (transaction: Transaction) => {
    if (!currentUserId) return
    toast.warning(t('transactions.pending.rejectPrompt'), {
      action: {
        label: t('transactions.pending.reject'),
        onClick: () => {
          updateMutation.mutate(
            {
              id: transaction.id,
              data: {
                status: 'Rejected',
                rejectionReason: t('transactions.pending.reject'),
                approvedBy: currentUserId,
                approvedAt: new Date().toISOString(),
              },
            },
            {
              onSuccess: () => toast.success(t('transactions.pending.rejectSuccess')),
            },
          )
        },
      },
    })
  }

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
    <div className="h-full min-h-0 flex flex-col gap-4 border rounded-xl p-4 bg-muted/30">
      <div className="flex items-start justify-between gap-3 shrink-0">
        <h3 className="text-lg font-semibold text-orange-600">{t('transactions.pending.title')}</h3>
        <Badge variant="destructive" className="rounded-full px-2.5 py-0.5 text-xs">
          {pendingTransactions.length}
        </Badge>
      </div>
      <DataTable columns={columns} data={pendingTransactions} className="pb-4" fullHeight />
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

  const historyFilters = React.useMemo(
    () => [
      {
        columnId: 'status',
        label: t('transactions.table.status'),
        type: 'select' as const,
        options: [
          { label: t('transactions.form.statusApproved'), value: 'Approved' },
          { label: t('transactions.form.statusPending'), value: 'Pending' },
          { label: t('transactions.form.statusRejected'), value: 'Rejected' },
        ],
      },
      {
        columnId: 'userId',
        label: t('transactions.form.userLabel'),
        type: 'select' as const,
        options: users.map((user) => ({ label: user.name, value: user.id })),
      },
      {
        columnId: 'projectId',
        label: t('transactions.form.projectLabel'),
        type: 'select' as const,
        options: projects.map((project) => ({ label: project.name, value: project.id })),
      },
    ],
    [projects, t, users],
  )

  const historyBulkActions = React.useMemo<DataTableBulkAction<Transaction>[]>(
    () => [
      {
        label: t('transactions.form.statusApproved'),
        onClick: (rows) => {
          rows.forEach((row) => {
            updateMutation.mutate({
              id: row.id,
              data: {
                status: 'Approved',
                approvedBy: currentUserId ?? undefined,
                approvedAt: new Date().toISOString(),
              },
            })
          })
          toast.success(t('transactions.pending.approveSuccess'))
        },
      },
      {
        label: t('transactions.form.statusRejected'),
        variant: 'destructive',
        onClick: (rows) => {
          rows.forEach((row) => {
            updateMutation.mutate({
              id: row.id,
              data: {
                status: 'Rejected',
                approvedBy: currentUserId ?? undefined,
                approvedAt: new Date().toISOString(),
                rejectionReason: t('transactions.form.statusRejected'),
              },
            })
          })
          toast.success(t('transactions.pending.rejectSuccess'))
        },
      },
    ],
    [currentUserId, t, updateMutation],
  )

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
                  toast.warning(t('common.undoWarning'), {
                    action: {
                      label: t('common.delete'),
                      onClick: () => deleteMutation.mutate(transaction.id),
                    },
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
    return <div>{t('transactions.error.description')}</div>
  }

  return (
    <div className="flex flex-col h-full min-h-0 gap-8">
      <div className="flex items-center justify-between shrink-0">
        <h2 className="text-3xl font-bold tracking-tight">{t('transactions.title')}</h2>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t('transactions.actions.create')}
        </Button>
      </div>

      <Tabs defaultValue="approval" className="flex-1 min-h-0 flex flex-col">
        <TabsList className="w-full grid grid-cols-2 shrink-0">
          <TabsTrigger value="approval">Request your approval</TabsTrigger>
          <TabsTrigger value="history">{t('transactions.history')}</TabsTrigger>
        </TabsList>

        <TabsContent value="approval" className="pt-4 flex-1 min-h-0 overflow-hidden">
          <div className="h-full min-h-0 overflow-hidden">
            {currentUserId ? (
              <PendingTransactionsTable
                transactions={allTransactions}
                currentUserId={currentUserId}
              />
            ) : (
              <div className="h-full border rounded-xl p-4 bg-muted/30 text-sm text-muted-foreground">
                {t('transactions.pending.title')}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="pt-4 flex-1 min-h-0 flex flex-col gap-4">
          <div className="flex-1 min-h-0 flex flex-col gap-4">
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
              <UnifiedDataTable
                columns={columns}
                data={displayedTransactions}
                filterColumn="customer_name"
                filters={historyFilters}
                bulkActions={historyBulkActions}
                enableSelection
                enableGrouping
                groupableColumns={['status', 'userId', 'projectId']}
                enablePagination
                pageSizeOptions={[10, 20, 50]}
                initialPageSize={10}
                enableExport
                exportFileName="transactions-history.csv"
                className="pb-4"
                fullHeight
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <CrudSheetContent className="sm:max-w-[560px]">
          <CrudSheetHeader
            title={t('transactions.actions.create')}
            description={t('transactions.form.createDescription')}
            onClose={() => setIsCreateOpen(false)}
          />
          <CrudSheetBody className="p-6">
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
          </CrudSheetBody>
        </CrudSheetContent>
      </Sheet>

      <Sheet
        open={!!editingTransaction}
        onOpenChange={(open) => !open && setEditingTransaction(null)}
      >
        <CrudSheetContent className="sm:max-w-[560px]">
          <CrudSheetHeader
            title={t('transactions.actions.edit')}
            description={t('transactions.form.editDescription')}
            onClose={() => setEditingTransaction(null)}
          />
          <CrudSheetBody className="p-6">
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
          </CrudSheetBody>
        </CrudSheetContent>
      </Sheet>
    </div>
  )
}
