import { IconArrowLeft, IconEdit, IconTrash, IconAlertTriangle } from '@tabler/icons-react'
import { useParams, Link } from '@tanstack/react-router'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/shared/lib/utils'
import { useBudget, useDeleteBudget } from '../api/budgets.queries'
import { formatAmount } from '../model/period-utils'
import type { BudgetScope } from '../model/types'
import { AddTransactionToBudgetSheet } from './AddTransactionToBudgetSheet'
import { BudgetCategoryLimits } from './BudgetCategoryLimits'
import { BudgetMembersPanel } from './BudgetMembersPanel'
import { BudgetRecurrencesPanel } from './BudgetRecurrencesPanel'
import { BudgetSummaryCards } from './BudgetSummaryCards'
import { BudgetTransactionsList } from './BudgetTransactionsList'
import { EditBudgetSheet } from './EditBudgetSheet'

const SCOPE_COLORS: Record<BudgetScope, string> = {
  personal: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  project: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  department: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  company: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
}

export function BudgetDetailPage() {
  const { t } = useTranslation()
  const { budgetId } = useParams({ from: '/_dashboard/dashboard/budgets/$budgetId' })
  const { data: budget, isLoading } = useBudget(budgetId)
  const deleteBudget = useDeleteBudget()
  const [editOpen, setEditOpen] = React.useState(false)
  const [addTxOpen, setAddTxOpen] = React.useState(false)

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  if (!budget) {
    return (
      <div className="p-6 text-center text-muted-foreground">{t('budgets.detail.notFound')}</div>
    )
  }

  const health = budget.health
  const isOver = health?.status === 'over_budget'

  const handleDelete = async () => {
    if (!confirm(t('budgets.actions.deleteConfirm'))) return
    await deleteBudget.mutateAsync(budget.id)
    window.history.back()
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Back nav */}
      <Link
        to="/dashboard/budgets"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <IconArrowLeft className="size-4" />
        {t('budgets.title')}
      </Link>

      {/* Header card */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            {/* Title row */}
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold tracking-tight">{budget.name}</h1>
              {isOver && (
                <span className="flex items-center gap-1 text-xs text-red-600 font-medium bg-red-100 dark:bg-red-950/40 px-2 py-0.5 rounded-full shrink-0">
                  <IconAlertTriangle className="size-3" />
                  {t('budgets.detail.overBudget')}
                </span>
              )}
              <span
                className={cn(
                  'text-xs px-2 py-0.5 rounded-full font-medium shrink-0',
                  SCOPE_COLORS[budget.scope],
                )}
              >
                {t(`budgets.scopes.${budget.scope}`)}
              </span>
            </div>

            {/* Description */}
            {budget.description && (
              <p className="text-sm text-muted-foreground">{budget.description}</p>
            )}

            {/* Meta row */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <span className="capitalize">{t(`budgets.periods.${budget.periodType}`)}</span>
              <span className="h-3 w-px bg-border" />
              <span>{budget.currency}</span>
              {budget.targetAmount !== null && (
                <>
                  <span className="h-3 w-px bg-border" />
                  <span>
                    {t('budgets.fields.targetAmount')}:{' '}
                    <span className="font-medium text-foreground">
                      {formatAmount(budget.targetAmount, budget.currency)}
                    </span>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
              className="gap-1.5"
            >
              <IconEdit className="size-3.5" />
              {t('common.edit')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleteBudget.isPending}
              className="gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <IconTrash className="size-3.5" />
              {t('common.delete')}
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {health && <BudgetSummaryCards health={health} currency={budget.currency} />}

      {/* Tabs */}
      <Tabs defaultValue="transactions" className="space-y-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="transactions">{t('budgets.detail.tabs.transactions')}</TabsTrigger>
          <TabsTrigger value="categories">{t('budgets.detail.tabs.categories')}</TabsTrigger>
          <TabsTrigger value="members">{t('budgets.detail.tabs.members')}</TabsTrigger>
          <TabsTrigger value="recurring">{t('budgets.detail.tabs.recurring')}</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <BudgetTransactionsList
            budgetId={budget.id}
            currency={budget.currency}
            onAddTransaction={() => setAddTxOpen(true)}
          />
        </TabsContent>

        <TabsContent value="categories">
          <BudgetCategoryLimits budgetId={budget.id} currency={budget.currency} />
        </TabsContent>

        <TabsContent value="members">
          <BudgetMembersPanel budgetId={budget.id} ownerId={budget.ownerId} />
        </TabsContent>

        <TabsContent value="recurring">
          <BudgetRecurrencesPanel budgetId={budget.id} currency={budget.currency} />
        </TabsContent>
      </Tabs>

      {editOpen && <EditBudgetSheet open={editOpen} onOpenChange={setEditOpen} budget={budget} />}
      <AddTransactionToBudgetSheet
        budgetId={budget.id}
        currency={budget.currency}
        open={addTxOpen}
        onOpenChange={setAddTxOpen}
      />
    </div>
  )
}
