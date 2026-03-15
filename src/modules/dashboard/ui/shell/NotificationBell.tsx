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
import { useUsers } from '@/modules/users'

export function NotificationBell() {
  const { data: allTransactions = [] } = useTransactions()
  const { data: users = [] } = useUsers()

  // MOCK AUTH: Assume the logged in user is one of the admins for demonstration
  const currentUserId = React.useMemo(() => {
    const admin = users.find((u) => u.roleName?.toLowerCase() === 'admin')
    return admin ? admin.id : ''
  }, [users])

  const pendingTransactions = React.useMemo(() => {
    if (!currentUserId) return []
    return allTransactions.filter(
      (t) => t.status === 'Pending' && t.assignedAdminId === currentUserId,
    )
  }, [allTransactions, currentUserId])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {pendingTransactions.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full p-0 text-[10px]"
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
            <div className="max-h-[300px] overflow-y-auto">
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
