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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet } from '@/components/ui/sheet'
import { useCategories } from '@/modules/categories'
import { cn } from '@/shared/lib/utils'
import { useUpdateRecurrenceRule } from '../api/budget-recurrences.queries'
import type { BudgetRecurrenceFrequency, BudgetRecurrenceRule } from '../model/types'

const FREQUENCIES: BudgetRecurrenceFrequency[] = [
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'semiannual',
  'annual',
]

interface EditRecurrenceSheetProps {
  rule: BudgetRecurrenceRule
  currency: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditRecurrenceSheet({
  rule,
  currency,
  open,
  onOpenChange,
}: EditRecurrenceSheetProps) {
  const { t } = useTranslation()
  const updateMutation = useUpdateRecurrenceRule(rule.budgetId)
  const { data: categories = [] } = useCategories()

  const [form, setForm] = React.useState({
    type: (rule.amount <= 0 ? 'expense' : 'income') as 'expense' | 'income',
    description: rule.description ?? '',
    amount: String(Math.abs(rule.amount) / 100),
    frequency: rule.frequency,
    interval: String(rule.interval),
    categoryId: rule.categoryId ?? '__none__',
  })

  // Sync form when rule changes (e.g. different rule opened)
  React.useEffect(() => {
    setForm({
      type: rule.amount <= 0 ? 'expense' : 'income',
      description: rule.description ?? '',
      amount: String(Math.abs(rule.amount) / 100),
      frequency: rule.frequency,
      interval: String(rule.interval),
      categoryId: rule.categoryId ?? '__none__',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rule.id])

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) return
    const signedAmount = Math.round(amount * 100) * (form.type === 'expense' ? -1 : 1)

    await updateMutation.mutateAsync({
      id: rule.id,
      description: form.description || null,
      amount: signedAmount,
      frequency: form.frequency,
      interval: parseInt(form.interval, 10) || 1,
      categoryId: form.categoryId === '__none__' ? null : form.categoryId,
    })
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <CrudSheetContent pinnable>
        <CrudSheetHeader
          title={t('budgets.recurrences.editTitle', 'Edit Recurring Rule')}
          onClose={() => onOpenChange(false)}
          showPing={false}
        />

        <form id="edit-recurrence-form" onSubmit={handleSubmit}>
          <CrudSheetBody>
            <CrudSheetSection>
              {/* Type toggle */}
              <div className="flex rounded-lg border overflow-hidden">
                <button
                  type="button"
                  onClick={() => updateField('type', 'expense')}
                  className={cn(
                    'flex-1 py-2 text-xs font-semibold transition-colors',
                    form.type === 'expense'
                      ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-r border-red-200 dark:border-red-900'
                      : 'text-muted-foreground hover:bg-muted border-r border-border',
                  )}
                >
                  ↓ {t('budgets.recurrences.typeExpense', 'Expense')}
                </button>
                <button
                  type="button"
                  onClick={() => updateField('type', 'income')}
                  className={cn(
                    'flex-1 py-2 text-xs font-semibold transition-colors',
                    form.type === 'income'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                      : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  ↑ {t('budgets.recurrences.typeIncome', 'Income')}
                </button>
              </div>

              <div className="space-y-1">
                <Label>{t('budgets.recurrences.description')}</Label>
                <Input
                  value={form.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder={t('budgets.recurrences.descriptionPlaceholder')}
                />
              </div>

              <div className="space-y-1">
                <Label>
                  {t('budgets.recurrences.amount')} ({currency})
                </Label>
                <Input
                  type="number"
                  min={0.01}
                  step={0.01}
                  value={form.amount}
                  onChange={(e) => updateField('amount', e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>{t('budgets.recurrences.frequencyLabel')}</Label>
                  <Select
                    value={form.frequency}
                    onValueChange={(v) => updateField('frequency', v as BudgetRecurrenceFrequency)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((f) => (
                        <SelectItem key={f} value={f}>
                          {t(`budgets.recurrences.frequency.${f}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>{t('budgets.recurrences.interval', 'Every N')}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={form.interval}
                    onChange={(e) => updateField('interval', e.target.value)}
                  />
                </div>
              </div>
              {/* Preview */}
              <p className="text-[11px] text-muted-foreground bg-muted/40 rounded-md px-3 py-1.5">
                → {t('budgets.recurrences.repeatPreview', 'Repeats every')}{' '}
                <span className="font-semibold text-foreground">
                  {parseInt(form.interval, 10) || 1}{' '}
                  {t(`budgets.recurrences.frequency.${form.frequency}`)}
                </span>
              </p>

              {categories.length > 0 && (
                <div className="space-y-1">
                  <Label>{t('budgets.recurrences.category')}</Label>
                  <Select
                    value={form.categoryId}
                    onValueChange={(v) => updateField('categoryId', v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('budgets.recurrences.categoryPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">
                        {t('budgets.recurrences.noCategory', 'None')}
                      </SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CrudSheetSection>
          </CrudSheetBody>
        </form>

        <CrudSheetActions>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button form="edit-recurrence-form" type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </CrudSheetActions>
      </CrudSheetContent>
    </Sheet>
  )
}
