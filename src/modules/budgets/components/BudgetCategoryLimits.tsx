import { Plus, Pencil, Trash2 } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  CrudSheetActions,
  CrudSheetBody,
  CrudSheetContent,
  CrudSheetHeader,
  CrudSheetSection,
} from '@/components/ui/crud-sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategories } from '@/modules/categories'
import { cn } from '@/shared/lib/utils'
import {
  useBudgetCategoryLimits,
  useUpsertBudgetCategoryLimit,
  useDeleteBudgetCategoryLimit,
} from '../api/budget-limits.queries'
import { formatAmount } from '../model/period-utils'

interface BudgetCategoryLimitsProps {
  budgetId: string
  currency: string
}

interface LimitFormState {
  categoryId: string
  allocatedAmount: string
}

export function BudgetCategoryLimits({ budgetId, currency }: BudgetCategoryLimitsProps) {
  const { t } = useTranslation()
  const { data: limits, isLoading } = useBudgetCategoryLimits(budgetId)
  const { data: categories = [] } = useCategories()
  const upsertMutation = useUpsertBudgetCategoryLimit(budgetId)
  const deleteMutation = useDeleteBudgetCategoryLimit(budgetId)

  const [sheetOpen, setSheetOpen] = React.useState(false)
  const [form, setForm] = React.useState<LimitFormState>({ categoryId: '', allocatedAmount: '' })

  const existingCategoryIds = React.useMemo(
    () => new Set<string>((limits ?? []).map((l) => l.categoryId)),
    [limits],
  )

  const availableCategories = React.useMemo(
    () => categories.filter((c) => !existingCategoryIds.has(c.id) || c.id === form.categoryId),
    [categories, existingCategoryIds, form.categoryId],
  )

  function openEdit(limit: { categoryId: string; allocatedAmount: number }) {
    setForm({
      categoryId: limit.categoryId,
      allocatedAmount: (limit.allocatedAmount / 100).toFixed(2),
    })
    setSheetOpen(true)
  }

  function openCreate() {
    setForm({ categoryId: '', allocatedAmount: '' })
    setSheetOpen(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.categoryId || !form.allocatedAmount) return
    await upsertMutation.mutateAsync({
      budgetId,
      categoryId: form.categoryId,
      allocatedAmount: Math.round(parseFloat(form.allocatedAmount) * 100),
    })
    setSheetOpen(false)
  }

  async function handleDelete(categoryId: string) {
    await deleteMutation.mutateAsync({ budgetId, categoryId })
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {limits?.length ?? 0} {t('budgets.limits.count')}
        </p>
        <Button size="sm" variant="outline" onClick={openCreate}>
          <Plus className="size-4 mr-1" />
          {t('budgets.limits.add')}
        </Button>
      </div>

      {!limits?.length ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          {t('budgets.limits.empty')}
        </div>
      ) : (
        <div className="space-y-3">
          {limits.map((limit) => {
            const spent = limit.spent ?? 0
            const allocated = limit.allocatedAmount
            const pct = allocated > 0 ? Math.min(100, (spent / allocated) * 100) : 0
            const isOver = spent > allocated
            return (
              <div key={limit.categoryId} className="rounded-lg border bg-card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {limit.categoryColor && (
                      <span
                        className="size-3 rounded-full"
                        style={{ backgroundColor: limit.categoryColor }}
                      />
                    )}
                    <span className="text-sm font-medium">
                      {limit.categoryName ?? limit.categoryId}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      onClick={() => openEdit(limit)}
                    >
                      <Pencil className="size-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7 text-destructive"
                      onClick={() => handleDelete(limit.categoryId)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                </div>

                <Progress
                  value={pct}
                  className={cn(
                    'h-2',
                    isOver && '[&>div]:bg-red-500',
                    !isOver && pct >= 80 && '[&>div]:bg-yellow-500',
                  )}
                />

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    {t('budgets.limits.spent')}: {formatAmount(spent, currency)}
                  </span>
                  <span className={cn(isOver && 'text-red-600 font-semibold')}>
                    {formatAmount(allocated, currency)} {t('budgets.limits.allocated')}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <CrudSheetContent>
          <CrudSheetHeader
            title={
              form.categoryId && existingCategoryIds.has(form.categoryId)
                ? t('budgets.limits.editTitle')
                : t('budgets.limits.addTitle')
            }
            onClose={() => setSheetOpen(false)}
            showPing={false}
          />

          <form id="limit-form" onSubmit={handleSubmit}>
            <CrudSheetBody>
              <CrudSheetSection>
                <div className="space-y-1">
                  <Label>{t('budgets.limits.category')}</Label>
                  <Select
                    value={form.categoryId}
                    onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('budgets.limits.selectCategory')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>
                    {t('budgets.limits.amount')} ({currency})
                  </Label>
                  <Input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={form.allocatedAmount}
                    onChange={(e) => setForm((f) => ({ ...f, allocatedAmount: e.target.value }))}
                  />
                </div>
              </CrudSheetSection>
            </CrudSheetBody>
          </form>

          <CrudSheetActions>
            <Button type="button" variant="outline" onClick={() => setSheetOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button form="limit-form" type="submit" disabled={upsertMutation.isPending}>
              {upsertMutation.isPending ? t('common.saving') : t('common.save')}
            </Button>
          </CrudSheetActions>
        </CrudSheetContent>
      </Sheet>
    </div>
  )
}
