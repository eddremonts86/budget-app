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
import type { Category } from '../model/types'

export function useCategoryColumns(
  onEdit: (category: Category) => void,
  onDelete: (category: Category) => void,
): ColumnDef<Category>[] {
  const { t } = useTranslation()

  return React.useMemo(
    (): ColumnDef<Category>[] => [
      {
        accessorKey: 'name',
        header: t('categories.columns.name'),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div
              className="size-4 rounded border border-border/40 shadow-sm shrink-0"
              style={{ backgroundColor: row.original.color }}
            />
            <span className="font-medium">{row.original.name}</span>
          </div>
        ),
      },
      {
        accessorKey: 'color',
        header: t('categories.columns.color'),
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div
              className="size-6 rounded-lg border border-border/50 shadow-sm shrink-0"
              style={{ backgroundColor: row.original.color }}
            />
            <code className="bg-muted/50 px-2 py-1 rounded-md text-xs font-mono border border-border/20">
              {row.original.color.toUpperCase()}
            </code>
          </div>
        ),
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const category = row.original
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
                <DropdownMenuItem onClick={() => onEdit(category)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(category)}>
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
