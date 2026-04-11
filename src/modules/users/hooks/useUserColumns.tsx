import type { ColumnDef } from '@tanstack/react-table'
import { Mail, MoreHorizontal, Pencil, ShieldCheck, Trash2 } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
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
import { cn } from '@/shared/lib/utils'
import type { User } from '../model/types'

export function useUserColumns(
  onEdit: (user: User) => void,
  onDelete: (user: User) => void,
): ColumnDef<User, unknown>[] {
  const { t } = useTranslation()

  return React.useMemo(
    () => [
      {
        accessorKey: 'name',
        header: t('users.table.user'),
        cell: ({ row }) => {
          const avatar = row.original.avatar || undefined
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
        accessorKey: 'roleName',
        header: t('users.table.role'),
        cell: ({ row }) => {
          const role = (row.getValue('roleName') as string) || '-'
          const isAdmin = role.toLowerCase().includes('admin')
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
        accessorKey: 'jobTitleName',
        header: t('users.table.jobTitle'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.jobTitleName || '-'}</span>
        ),
      },
      {
        accessorKey: 'departmentName',
        header: t('users.table.department'),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.departmentName || '-'}
          </span>
        ),
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
                  onClick={() => onEdit(user)}
                  className="rounded-lg m-1 gap-2 cursor-pointer focus:bg-primary/5 focus:text-primary"
                >
                  <Pencil className="h-4 w-4" />
                  {t('users.actions.editProfile')}
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-border/40" />
                <DropdownMenuItem
                  className="text-destructive rounded-lg m-1 gap-2 cursor-pointer focus:bg-destructive/5 focus:text-destructive"
                  onClick={() => onDelete(user)}
                >
                  <Trash2 className="h-4 w-4" />
                  {t('users.actions.deleteAccount')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      },
    ],
    [t, onEdit, onDelete],
  )
}
