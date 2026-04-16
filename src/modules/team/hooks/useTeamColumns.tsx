import { type ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { TeamWithUsers } from '../model/types'

export function useTeamColumns(
  onEdit: (team: TeamWithUsers) => void,
  onDelete: (team: TeamWithUsers) => void,
): ColumnDef<TeamWithUsers>[] {
  const { t } = useTranslation()

  return React.useMemo(
    (): ColumnDef<TeamWithUsers>[] => [
      {
        accessorKey: 'name',
        header: t('team.fields.name', { defaultValue: 'Name' }),
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: 'description',
        header: t('team.fields.description', { defaultValue: 'Description' }),
        cell: ({ row }) => (
          <span className="text-muted-foreground line-clamp-1">
            {row.original.description || '—'}
          </span>
        ),
      },
      {
        accessorKey: 'memberCount',
        header: t('team.members', { defaultValue: 'Members' }),
        accessorFn: (row) => row.members.length,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.members.length}</span>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const team = row.original
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
                <DropdownMenuItem onClick={() => onEdit(team)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(team)}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('common.delete')}
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
