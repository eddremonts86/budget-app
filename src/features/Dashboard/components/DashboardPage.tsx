import { IconUsers, IconCreditCard, IconActivity, IconCurrencyDollar } from '@tabler/icons-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Skeleton,
} from '@/components/ui'
import { useDashboardStats, useRecentTransactions } from '../api/dashboard.queries'

export function DashboardPage() {
  const { data: stats, isLoading: isLoadingStats, isError: isErrorStats } = useDashboardStats()
  const {
    data: transactions,
    isLoading: isLoadingTransactions,
    isError: isErrorTransactions,
  } = useRecentTransactions()

  if (isErrorStats || isErrorTransactions) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-destructive">Error</h2>
          <p className="text-muted-foreground">
            Ocurrió un error al cargar los datos del dashboard.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoadingStats ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4 rounded-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-[120px] mb-2" />
                <Skeleton className="h-3 w-[150px]" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats?.revenue.value.toLocaleString() ?? '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(stats?.revenue.change ?? 0) > 0 ? '+' : ''}
                  {stats?.revenue.change ?? 0}% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
                <IconUsers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(stats?.subscriptions.value ?? 0) > 0 ? '+' : ''}
                  {stats?.subscriptions.value.toLocaleString() ?? '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(stats?.subscriptions.change ?? 0) > 0 ? '+' : ''}
                  {stats?.subscriptions.change ?? 0}% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Sales</CardTitle>
                <IconCreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(stats?.sales.value ?? 0) > 0 ? '+' : ''}
                  {stats?.sales.value.toLocaleString() ?? '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(stats?.sales.change ?? 0) > 0 ? '+' : ''}
                  {stats?.sales.change ?? 0}% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Now</CardTitle>
                <IconActivity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {(stats?.activeNow.value ?? 0) > 0 ? '+' : ''}
                  {stats?.activeNow.value.toLocaleString() ?? '0'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(stats?.activeNow.change ?? 0) > 0 ? '+' : ''}
                  {stats?.activeNow.change ?? 0} {stats?.activeNow.context ?? ''}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            {isLoadingTransactions ? (
              <Skeleton className="h-4 w-[250px]" />
            ) : (
              `You made ${transactions?.length || 0} sales this month.`
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingTransactions
                ? Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-5 w-[150px] mb-1" />
                        <Skeleton className="h-4 w-[120px]" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-6 w-[80px] rounded-full" />
                      </TableCell>
                      <TableCell>
                        <Skeleton className="h-4 w-[100px]" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-5 w-[60px] ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                : transactions?.map((tx) => (
                    <TableRow key={tx.id}>
                      <TableCell>
                        <div className="font-medium">{tx.customer.name}</div>
                        <div className="text-sm text-muted-foreground hidden md:inline">
                          {tx.customer.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tx.status}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">{tx.date}</TableCell>
                      <TableCell className="text-right">${tx.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
