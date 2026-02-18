import { type ColumnDef } from '@tanstack/react-table'
import { motion } from 'framer-motion'
import {
  ChevronDown,
  Mail,
  MoreHorizontal,
  Pencil,
  ShieldCheck,
  Trash2,
  UserPlus,
} from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useInView } from 'react-intersection-observer'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { toast } from '@/shared/lib/toast'
import { cn } from '@/shared/lib/utils'
import { DataTable } from '@/shared/ui/DataTable'
import { useCreateUser, useDeleteUser, useInfiniteUsers, useUpdateUser } from '../api/users.queries'
import type { User } from '../model/types'
import { UserForm } from './UserForm'

export function UsersPage() {
  const { t } = useTranslation()
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<User | null>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteUsers(10)

  const { ref, inView } = useInView()

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()
  const deleteMutation = useDeleteUser()

  const columns: ColumnDef<User>[] = [
    {
      accessorKey: 'name',
      header: t('users.table.user'),
      cell: ({ row }) => {
        const avatar = row.original.avatar
        const name = row.original.name
        const email = row.original.email
        return (
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
              <AvatarImage src={avatar} alt={name} />
              <AvatarFallback className="bg-primary/5 text-primary font-bold">
                {name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-semibold text-foreground leading-none">{name}</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <Mail className="w-3 h-3" /> {email}
              </span>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'role',
      header: t('users.table.role'),
      cell: ({ row }) => {
        const role = row.getValue('role') as string
        const isAdmin = role === 'admin'
        return (
          <Badge
            variant="outline"
            className={cn(
              'capitalize px-3 py-1 rounded-full border-none font-medium',
              isAdmin ? 'bg-primary/10 text-primary' : 'bg-secondary text-secondary-foreground',
            )}
          >
            <div className="flex items-center gap-1.5">
              {isAdmin && <ShieldCheck className="w-3.5 h-3.5" />}
              {role}
            </div>
          </Badge>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 p-0 rounded-full hover:bg-secondary/80">
                <span className="sr-only">{t('common.openMenu')}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-48 p-2 rounded-2xl shadow-2xl backdrop-blur-xl border-border/40"
            >
              <DropdownMenuLabel className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-muted-foreground/70">
                {t('common.actions')}
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => setEditingUser(user)}
                className="rounded-lg m-1 gap-2 cursor-pointer focus:bg-primary/5 focus:text-primary"
              >
                <Pencil className="h-4 w-4" />
                {t('users.actions.editProfile')}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/40" />
              <DropdownMenuItem
                className="text-destructive rounded-lg m-1 gap-2 cursor-pointer focus:bg-destructive/5 focus:text-destructive"
                onClick={() => {
                  toast.error(t('users.confirm.delete'), {
                    description: t('common.confirm'),
                    action: {
                      label: t('common.delete'),
                      onClick: () => deleteMutation.mutate(user.id),
                    },
                    duration: 10000,
                  })
                }}
              >
                <Trash2 className="h-4 w-4" />
                {t('users.actions.deleteAccount')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  if (isError) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center justify-center h-[400px]"
      >
        <div className="text-center space-y-4 max-w-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">{t('users.error.title')}</h2>
            <p className="text-muted-foreground text-sm">{t('users.error.description')}</p>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            {t('users.error.retry')}
          </Button>
        </div>
      </motion.div>
    )
  }

  const allUsers = data?.pages.flatMap((page) => page.data) ?? []
  const totalCount = data?.pages[0]?.totalCount ?? 0

  return (
    <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
        <div className="space-y-1">
          <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            {t('users.title')}
          </h2>
          <p className="text-muted-foreground font-medium">
            {t('users.subtitlePrefix')}
            <span className="text-foreground">{totalCount}</span>
            {t('users.subtitleSuffix')}
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-2xl h-12 px-6 gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          {t('users.actions.new')}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-[64px] w-full rounded-3xl" />
          <Skeleton className="h-[64px] w-full rounded-3xl" />
          <Skeleton className="h-[64px] w-full rounded-3xl" />
        </div>
      ) : (
        <div className="relative group flex-1 min-h-0 flex flex-col">
          <DataTable columns={columns} data={allUsers} filterColumn="name" fullHeight>
            {hasNextPage && (
              <TableRow className="hover:bg-transparent border-none">
                <TableCell colSpan={columns.length} className="py-8">
                  <div ref={ref} className="flex justify-center">
                    <Button
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                      variant="outline"
                      className="h-12 px-10 rounded-2xl border-dashed border-border/60 hover:border-primary/30 hover:bg-primary/5 transition-all group"
                    >
                      {isFetchingNextPage ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          {t('users.loadingMore')}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 font-semibold">
                          {t('users.loadMore')}
                          <ChevronDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
                        </div>
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </DataTable>
        </div>
      )}

      {/* Sheets with custom styling */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <SheetContent className="sm:max-w-[540px] p-0 gap-0 border-l border-border/40 bg-background/95 backdrop-blur-xl shadow-2xl">
          <SheetHeader className="p-6 border-b bg-muted/10">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 mt-1">
                <UserPlus className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-left">
                <SheetTitle className="text-xl font-bold tracking-tight text-foreground">
                  {t('users.sheet.createTitle')}
                </SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground/80 leading-relaxed">
                  {t('users.sheet.createDescription')}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="p-6">
            <UserForm
              onSubmit={async (values) => {
                await createMutation.mutateAsync({
                  ...values,
                  createdAt: new Date().toISOString(),
                })
                setIsCreateOpen(false)
              }}
              onCancel={() => setIsCreateOpen(false)}
              isLoading={createMutation.isPending}
            />
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <SheetContent className="sm:max-w-[540px] p-0 gap-0 border-l border-border/40 bg-background/95 backdrop-blur-xl shadow-2xl">
          <SheetHeader className="p-6 border-b bg-muted/10">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20 mt-1">
                <Pencil className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-left">
                <SheetTitle className="text-xl font-bold tracking-tight text-foreground">
                  {t('users.sheet.editTitle')}
                </SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground/80 leading-relaxed">
                  {t('users.sheet.editDescription')}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>
          <div className="p-6">
            {editingUser && (
              <UserForm
                defaultValues={editingUser}
                onSubmit={async (values) => {
                  await updateMutation.mutateAsync({ id: editingUser.id, data: values })
                  setEditingUser(null)
                }}
                onCancel={() => setEditingUser(null)}
                isLoading={updateMutation.isPending}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
