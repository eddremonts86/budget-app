import { Link } from '@tanstack/react-router'
import { Bell } from 'lucide-react'
import * as React from 'react'
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
import { useTransactions } from '@/modules/transactions'
import { useCurrentUser } from '@/modules/users'
import { getTransactionsPendingApprovalForUser } from '@/modules/users/model/permissions'

export function NotificationBell() {
  const { syncedUserId: currentUserId, roleKey, canApproveTransactions } = useCurrentUser()
  const { data: allTransactions = [] } = useTransactions({ enabled: canApproveTransactions })

  const pendingTransactions = React.useMemo(() => {
    return getTransactionsPendingApprovalForUser(allTransactions, currentUserId, roleKey)
  }, [allTransactions, currentUserId, roleKey])

  if (!canApproveTransactions) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          data-testid="dashboard-notification-trigger"
        >
          <Bell className="h-5 w-5" />
          {pendingTransactions.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full p-0 text-[10px]"
              data-testid="dashboard-notification-badge"
            >
              {pendingTransactions.length}
            </Badge>
          )}
          <span className="sr-only">Toggle notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {pendingTransactions.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">No pending approvals</div>
        ) : (
          <>
            <div className="max-h-75 overflow-y-auto">
              {pendingTransactions.map((transaction) => (
                <DropdownMenuItem key={transaction.id} asChild>
                  <Link
                    to="/dashboard/transactions"
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-medium text-sm">Transaction Approval</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(transaction.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      New transaction from {transaction.customer.name} for ${transaction.amount}{' '}
                      requires your approval.
                    </p>
                  </Link>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="justify-center text-primary font-medium">
              <Link to="/dashboard/transactions">View all pending</Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
