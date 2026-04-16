import { type ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
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
import type { Budget, BudgetHealthSummary } from '../model/types'

type BudgetWithHealth = Budget & { health?: BudgetHealthSummary }

export function useBudgetColumns(
  onEdit: (budget: BudgetWithHealth) => void,
  onDelete: (budget: BudgetWithHealth) => void,
): ColumnDef<BudgetWithHealth>[] {
  const { t } = useTranslation()

  return React.useMemo(
    (): ColumnDef<BudgetWithHealth>[] => [
      {
        accessorKey: 'name',
        header: t('budgets.fields.name', { defaultValue: 'Name' }),
        cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
      },
      {
        accessorKey: 'scope',
        header: t('budgets.fields.scope', { defaultValue: 'Scope' }),
        cell: ({ row }) => (
          <Badge variant="outline" className="capitalize">
            {row.original.scope}
          </Badge>
        ),
      },
      {
        accessorKey: 'status',
        header: t('budgets.fields.status', { defaultValue: 'Status' }),
        cell: ({ row }) => (
          <Badge
            variant={row.original.status === 'active' ? 'default' : 'secondary'}
            className="capitalize"
          >
            {row.original.status}
          </Badge>
        ),
      },
      {
        accessorKey: 'periodType',
        header: t('budgets.fields.periodType', { defaultValue: 'Period' }),
        cell: ({ row }) => (
          <span className="capitalize text-muted-foreground">
            {row.original.periodType.replace('_', ' ')}
          </span>
        ),
      },
      {
        accessorKey: 'targetAmount',
        header: t('budgets.fields.targetAmount', { defaultValue: 'Target' }),
        cell: ({ row }) => {
          const amount = row.original.targetAmount
          if (amount === null) return <span className="text-muted-foreground">—</span>
          return (
            <span className="font-mono">
              {new Intl.NumberFormat(undefined, {
                style: 'currency',
                currency: row.original.currency || 'USD',
              }).format(amount)}
            </span>
          )
        },
      },
      {
        accessorKey: 'currency',
        header: t('budgets.fields.currency', { defaultValue: 'Currency' }),
        cell: ({ row }) => <span className="text-muted-foreground">{row.original.currency}</span>,
      },
      {
        id: 'actions',
        cell: ({ row }) => {
          const budget = row.original
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
                <DropdownMenuItem onClick={() => onEdit(budget)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t('common.edit')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete(budget)}>
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
