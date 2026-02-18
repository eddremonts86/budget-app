import { type ColumnDef } from '@tanstack/react-table'
import { motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  Flag,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserCircle,
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
import { Field, FieldGroup } from '@/components/ui/field'
import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useUsers } from '@/features/Users/api/users.queries'
import { useSyncAuthUser } from '@/features/Users/hooks/useSyncAuthUser'
import { toast } from '@/shared/lib/toast'
import { cn } from '@/shared/lib/utils'
import { DataTable } from '@/shared/ui/DataTable'
import { useDeleteTodo, useInfiniteTodos } from '../../api/todos.queries'
import { canModifyTodo } from '../../model/permissions'
import type { Todo } from '../../model/types'

interface ListViewProps {
  onEdit: (todo: Todo) => void
}

export function ListView({ onEdit }: ListViewProps) {
  const { t } = useTranslation()
  const { syncedUserId, userRole } = useSyncAuthUser()
  const { data: users } = useUsers()

  // Build a lookup map of userId → user for the assignee column
  const userMap = React.useMemo(() => {
    const map = new Map<string, { name: string; avatar: string }>()
    if (users) {
      for (const u of users) {
        map.set(u.id, { name: u.name, avatar: u.avatar })
      }
    }
    return map
  }, [users])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteTodos(10)

  const { ref, inView } = useInView()

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  const deleteMutation = useDeleteTodo()

  const columns: ColumnDef<Todo>[] = [
    {
      accessorKey: 'title',
      header: t('todos.table.title'),
      cell: ({ row }) => {
        const title = row.getValue('title') as string
        const dueDate = row.original.dueDate
        return (
          <div className="flex flex-col gap-1">
            <span className="font-semibold text-foreground leading-tight">{title}</span>
            {dueDate && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> {new Date(dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: t('todos.table.status'),
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        const variants: Record<string, string> = {
          completed: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
          in_progress: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
          pending: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        }
        const labels: Record<string, string> = {
          completed: t('todos.status.completed'),
          in_progress: t('todos.status.inProgress'),
          pending: t('todos.status.pending'),
        }
        return (
          <Badge
            variant="outline"
            className={cn('capitalize px-3 py-1 rounded-full border font-medium', variants[status])}
          >
            {labels[status] || status}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'priority',
      header: t('todos.table.priority'),
      cell: ({ row }) => {
        const priority = row.getValue('priority') as string
        const variants: Record<string, string> = {
          high: 'bg-destructive/10 text-destructive border-destructive/20',
          medium: 'bg-primary/10 text-primary border-primary/20',
          low: 'bg-secondary text-secondary-foreground border-transparent',
        }
        const labels: Record<string, string> = {
          high: t('todos.priority.high'),
          medium: t('todos.priority.medium'),
          low: t('todos.priority.low'),
        }
        return (
          <Badge
            variant="outline"
            className={cn(
              'capitalize px-3 py-1 rounded-full border font-medium',
              variants[priority],
            )}
          >
            <div className="flex items-center gap-1.5">
              <Flag className="w-3 h-3" />
              {labels[priority] || priority}
            </div>
          </Badge>
        )
      },
    },
    {
      accessorKey: 'assignedTo',
      header: t('todos.table.assignedTo'),
      cell: ({ row }) => {
        const assignedTo = row.getValue('assignedTo') as string
        const assignee = userMap.get(assignedTo)
        if (!assignee) {
          return (
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserCircle className="w-4 h-4 opacity-50" />
              <span className="text-xs">—</span>
            </div>
          )
        }
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={assignee.avatar} alt={assignee.name} />
                    <AvatarFallback className="text-[10px]">
                      {assignee.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-xs font-medium text-foreground truncate max-w-[100px]">
                    {assignee.name}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{assignee.name}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      },
    },
    {
      accessorKey: 'createdAt',
      header: t('todos.table.createdAt'),
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as string
        return (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-3.5 h-3.5 opacity-50" />
            <span className="text-xs font-medium">
              {date ? new Date(date).toLocaleDateString() : '-'}
            </span>
          </div>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const todo = row.original
        const canModify = canModifyTodo(todo, syncedUserId, userRole)

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
                onClick={() => {
                  if (!canModify) {
                    toast.warning(t('common.noPermission'), {
                      description: t('common.noPermissionEdit'),
                    })
                    return
                  }
                  onEdit(todo)
                }}
                className={cn(
                  'rounded-lg m-1 gap-2 cursor-pointer focus:bg-primary/5 focus:text-primary',
                  !canModify && 'opacity-50',
                )}
              >
                <Pencil className="h-4 w-4" />
                {t('todos.actions.edit')}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/40" />
              <DropdownMenuItem
                className={cn(
                  'text-destructive rounded-lg m-1 gap-2 cursor-pointer focus:bg-destructive/5 focus:text-destructive',
                  !canModify && 'opacity-50',
                )}
                onClick={() => {
                  if (!canModify) {
                    toast.warning(t('common.noPermission'), {
                      description: t('common.noPermissionDelete'),
                    })
                    return
                  }
                  toast.error(t('todos.confirm.delete'), {
                    description: t('common.undoWarning'),
                    action: {
                      label: t('common.delete'),
                      onClick: () => deleteMutation.mutate(todo.id),
                    },
                    cancel: {
                      label: t('common.cancel'),
                      onClick: () => {},
                    },
                    duration: 10000,
                  })
                }}
              >
                <Trash2 className="h-4 w-4" />
                {t('todos.actions.delete')}
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
            <h2 className="text-xl font-bold tracking-tight">{t('todos.error.title')}</h2>
            <p className="text-muted-foreground text-sm">{t('todos.error.description')}</p>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            {t('todos.error.retry')}
          </Button>
        </div>
      </motion.div>
    )
  }

  const allTodos = data?.pages.flatMap((page) => page.data) ?? []

  if (isLoading) {
    return (
      <FieldGroup className="space-y-4">
        <Skeleton className="h-[64px] w-full rounded-3xl" />
        <Skeleton className="h-[64px] w-full rounded-3xl" />
        <Skeleton className="h-[64px] w-full rounded-3xl" />
      </FieldGroup>
    )
  }

  return (
    <Field className="relative group h-full">
      <DataTable columns={columns} data={allTodos} filterColumn="title" fullHeight>
        {hasNextPage && (
          <TableRow className="border-none hover:bg-transparent">
            <TableCell colSpan={columns.length} className="p-0">
              <div ref={ref} className="flex justify-center py-8">
                <div className="flex items-center gap-2 text-muted-foreground font-medium bg-secondary/20 px-6 py-3 rounded-2xl backdrop-blur-sm border border-border/40">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  {t('todos.loadingMore')}
                </div>
              </div>
            </TableCell>
          </TableRow>
        )}
      </DataTable>
    </Field>
  )
}
