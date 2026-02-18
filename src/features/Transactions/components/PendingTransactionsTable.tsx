import { type ColumnDef } from '@tanstack/react-table'
import { Check, X } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTable } from '@/shared/ui/DataTable'
import {
  useUpdateTransaction,
} from '../api/transactions.queries'
import type { Transaction } from '../model/types'
import { useUsers } from '@/features/Users/api/users.queries'
import { toast } from '@/shared/lib/toast'

interface PendingTransactionsTableProps {
  transactions: Transaction[]
  currentUserId: string // In a real app, this would be used to filter
}

export function PendingTransactionsTable({ transactions, currentUserId }: PendingTransactionsTableProps) {
  const { t } = useTranslation()
  const updateMutation = useUpdateTransaction()
  const { data: users = [] } = useUsers()

  const pendingTransactions = React.useMemo(() => {
    return transactions.filter(t => t.status === 'Pending' && t.assignedAdminId === currentUserId)
  }, [transactions, currentUserId])

  const handleApprove = (transaction: Transaction) => {
    if (confirm(t('transactions.confirm.approve'))) {
        updateMutation.mutate({
            id: transaction.id,
            data: {
                status: 'Approved',
                approvedBy: currentUserId,
                approvedAt: new Date().toISOString()
            }
        }, {
            onSuccess: () => toast.success(t('transactions.toast.approved'))
        })
    }
  }

  const handleReject = (transaction: Transaction) => {
    const reason = prompt(t('transactions.prompt.rejectionReason'))
    if (reason) {
        updateMutation.mutate({
            id: transaction.id,
            data: {
                status: 'Rejected',
                rejectionReason: reason,
                approvedBy: currentUserId, // Still tracked who rejected
                approvedAt: new Date().toISOString()
            }
        }, {
            onSuccess: () => toast.success(t('transactions.toast.rejected'))
        })
    }
  }

  const columns: ColumnDef<Transaction>[] = [
    {
      accessorKey: 'id',
      header: 'ID',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span>
    },
    {
        accessorKey: 'customer.name',
        header: t('transactions.table.customer'),
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
        accessorKey: 'userId',
        header: t('transactions.form.userLabel'),
        cell: ({ row }) => {
          const user = users.find((u) => u.id === row.original.userId)
          return user ? <span className="text-sm">{user.name}</span> : <span className="text-muted-foreground text-xs">Unknown</span>
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
            <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={() => handleApprove(transaction)}>
                <Check className="h-4 w-4" />
                <span className="sr-only">Approve</span>
            </Button>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleReject(transaction)}>
                <X className="h-4 w-4" />
                <span className="sr-only">Reject</span>
            </Button>
          </div>
        )
      },
    },
  ]

  if (pendingTransactions.length === 0) {
      return (
          <div className="text-center p-8 border border-dashed rounded-lg text-muted-foreground">
              No pending transactions requiring your approval.
          </div>
      )
  }

  return (
    <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
            Pending Approval
            <Badge variant="secondary">{pendingTransactions.length}</Badge>
        </h3>
        <DataTable columns={columns} data={pendingTransactions} />
    </div>
  )
}
