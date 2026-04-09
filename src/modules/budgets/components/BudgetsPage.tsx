import {
  IconPlus,
  IconWallet,
  IconAlertTriangle,
  IconUsers,
  IconUpload,
  IconDotsVertical,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react'
import { Link, useNavigate } from '@tanstack/react-router'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/shared/lib/toast'
import { cn } from '@/shared/lib/utils'
import { useBudgets, useDeleteBudget } from '../api/budgets.queries'
import { formatAmount } from '../model/period-utils'
import type { BudgetHealthStatus, BudgetScope } from '../model/types'
import type { Budget } from '../model/types'
import { BudgetMiniCharts } from './BudgetMiniCharts'
import { CreateBudgetSheet } from './CreateBudgetSheet'
import { EditBudgetSheet } from './EditBudgetSheet'
import { BudgetImportWizard } from './BudgetImportWizard'
import type { ImportOverride } from './BudgetImportWizard'
import type { BudgetImport } from '../api/budget-import.queries'

const SCOPE_COLORS: Record<BudgetScope, string> = {
  personal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  project: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  department: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  company: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
}

const HEALTH_PROGRESS_COLOR: Record<BudgetHealthStatus, string> = {
  healthy: 'bg-emerald-500',
  on_track: 'bg-emerald-400',
  warning: 'bg-amber-400',
  approaching: 'bg-orange-500',
  over_budget: 'bg-red-500',
  no_limit: 'bg-blue-400',
}

export function BudgetsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = React.useState(false)
  const [importOpen, setImportOpen] = React.useState(false)
  const [editingBudget, setEditingBudget] = React.useState<Budget | null>(null)
  const [pendingImportId, setPendingImportId] = React.useState<string | null>(null)
  const [pendingOverrides, setPendingOverrides] = React.useState<ImportOverride[]>([])
  const { data: budgets, isLoading } = useBudgets()
  const deleteBudget = useDeleteBudget()

  function handleDeleteBudget(budget: Budget) {
    toast.error(t('budgets.actions.deleteConfirm'), {
      description: t('common.undoWarning'),
      action: {
        label: t('common.delete'),
        onClick: () => deleteBudget.mutate(budget.id),
      },
      duration: 10000,
    })
  }

  function handleImportComplete(result: BudgetImport, overrides: ImportOverride[]) {
    setPendingImportId(result.id)
    setPendingOverrides(overrides)
    setImportOpen(false)
    setCreateOpen(true)
  }

  function handleCreateOpenChange(open: boolean) {
    setCreateOpen(open)
    if (!open) {
      setPendingImportId(null)
      setPendingOverrides([])
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t('budgets.title')}</h1>
          <p className="text-muted-foreground">{t('budgets.description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)} className="gap-2">
            <IconUpload className="size-4" />
            {t('budgets.import.actions.import')}
          </Button>
          <Button onClick={() => setCreateOpen(true)} className="gap-2">
            <IconPlus className="size-4" />
            {t('budgets.actions.create')}
          </Button>
        </div>
      </div>

      {/* Budget Cards Grid */}
      {isLoading ? (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-x-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-xl mb-4 break-inside-avoid" />
          ))}
        </div>
      ) : !budgets?.length ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <IconWallet className="size-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{t('budgets.empty.title')}</p>
            <p className="text-sm text-muted-foreground">{t('budgets.empty.description')}</p>
          </div>
          <Button onClick={() => setCreateOpen(true)} variant="outline" className="gap-2">
            <IconPlus className="size-4" />
            {t('budgets.actions.create')}
          </Button>
        </div>
      ) : (
        <div className="columns-1 md:columns-2 lg:columns-3 gap-x-4">
          {budgets.map((budget) => {
            const health = budget.health
            const usagePct = health?.usagePct ?? 0
            const isOver = health?.status === 'over_budget'

            return (
              <div
                key={budget.id}
                className="block group mb-4 break-inside-avoid cursor-pointer"
                onClick={() =>
                  navigate({
                    to: '/dashboard/budgets/$budgetId',
                    params: { budgetId: budget.id },
                  })
                }
              >
                <div
                  className={cn(
                    'border rounded-xl p-4 space-y-3 transition-all hover:shadow-md cursor-pointer',
                    isOver
                      ? 'border-red-300 bg-red-50/50 dark:bg-red-950/20 dark:border-red-800'
                      : 'border-border hover:border-primary/30 bg-card',
                  )}
                >
                  {/* Card header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-sm truncate">{budget.name}</span>
                        {isOver && <IconAlertTriangle className="size-4 text-red-500 shrink-0" />}
                      </div>
                      {budget.description && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {budget.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={cn(
                          'text-xs px-2 py-0.5 rounded-full font-medium',
                          SCOPE_COLORS[budget.scope],
                        )}
                      >
                        {t(`budgets.scopes.${budget.scope}`)}
                      </span>
                      {/* Actions menu — stops propagation so card onClick doesn't navigate */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <IconDotsVertical className="size-3.5" />
                              <span className="sr-only">{t('common.actions')}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingBudget(budget)}>
                              <IconEdit className="size-4 mr-2" />
                              {t('common.edit')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleDeleteBudget(budget)}
                            >
                              <IconTrash className="size-4 mr-2" />
                              {t('common.delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>

                  {/* Period + member count */}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="capitalize">{t(`budgets.periods.${budget.periodType}`)}</span>
                    <span>·</span>
                    <span>{budget.currency}</span>
                    <span>·</span>
                    <IconUsers className="size-3 shrink-0" />
                    <span>{budget.memberCount ?? 0}</span>
                  </div>

                  {/* Progress */}
                  {health && budget.targetAmount !== null ? (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span
                          className={isOver ? 'text-red-600 font-medium' : 'text-muted-foreground'}
                        >
                          {formatAmount(health.spent, budget.currency)} {t('budgets.detail.spent')}
                        </span>
                        <span className="font-medium">
                          {formatAmount(budget.targetAmount, budget.currency)}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all',
                            HEALTH_PROGRESS_COLOR[health.status],
                            isOver && 'animate-pulse',
                          )}
                          style={{ width: `${Math.min(100, usagePct ?? 0)}%` }}
                        />
                      </div>
                      {isOver && (
                        <p className="text-xs text-red-600 font-medium">
                          {t('budgets.detail.overBy', {
                            amount: formatAmount(health.overBy, budget.currency),
                          })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{t('budgets.detail.totalSpent')}</span>
                        <span className="font-medium">
                          {formatAmount(health?.spent ?? 0, budget.currency)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Balance */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <span className="text-xs text-muted-foreground">
                      {t('budgets.detail.balance')}
                    </span>
                    <span
                      className={cn(
                        'text-xs font-semibold',
                        (health?.balance ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600',
                      )}
                    >
                      {formatAmount(health?.balance ?? 0, budget.currency)}
                    </span>
                  </div>

                  {/* Mini charts */}
                  <BudgetMiniCharts budgetId={budget.id} currency={budget.currency} />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <CreateBudgetSheet
        open={createOpen}
        onOpenChange={handleCreateOpenChange}
        importId={pendingImportId}
        importOverrides={pendingOverrides}
      />

      {editingBudget && (
        <EditBudgetSheet
          open={!!editingBudget}
          onOpenChange={(open) => {
            if (!open) setEditingBudget(null)
          }}
          budget={editingBudget}
        />
      )}

      <BudgetImportWizard
        open={importOpen}
        onOpenChange={setImportOpen}
        onImportComplete={handleImportComplete}
      />
    </div>
  )
}
