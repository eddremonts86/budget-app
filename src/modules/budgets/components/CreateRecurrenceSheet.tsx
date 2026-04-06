import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useCategories } from '@/modules/categories'
import { useCreateRecurrenceRule } from '../api/budget-recurrences.queries'
import type { BudgetRecurrenceFrequency } from '../model/types'

interface CreateRecurrenceSheetProps {
  budgetId: string
  currency: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FREQUENCIES: BudgetRecurrenceFrequency[] = [
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'semiannual',
  'annual',
]

export function CreateRecurrenceSheet({
  budgetId,
  currency,
  open,
  onOpenChange,
}: CreateRecurrenceSheetProps) {
  const { t } = useTranslation()
  const createMutation = useCreateRecurrenceRule(budgetId)
  const { data: categories = [] } = useCategories()

  const [form, setForm] = React.useState({
    description: '',
    amount: '',
    frequency: 'monthly' as BudgetRecurrenceFrequency,
    interval: '1',
    categoryId: '',
    startDate: new Date().toISOString().split('T')[0],
  })

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) return

    await createMutation.mutateAsync({
      budgetId,
      description: form.description || null,
      amount: Math.round(amount * 100),
      frequency: form.frequency,
      interval: parseInt(form.interval, 10) || 1,
      categoryId: form.categoryId || null,
      startDate: form.startDate,
    })
    onOpenChange(false)
    setForm({
      description: '',
      amount: '',
      frequency: 'monthly',
      interval: '1',
      categoryId: '',
      startDate: new Date().toISOString().split('T')[0],
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t('budgets.recurrences.createTitle')}</SheetTitle>
        </SheetHeader>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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
              <Label>{t('budgets.recurrences.interval')}</Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={form.interval}
                onChange={(e) => updateField('interval', e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>{t('budgets.recurrences.startDate')}</Label>
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) => updateField('startDate', e.target.value)}
              required
            />
          </div>

          {categories.length > 0 && (
            <div className="space-y-1">
              <Label>{t('budgets.recurrences.category')}</Label>
              <Select value={form.categoryId} onValueChange={(v) => updateField('categoryId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('budgets.recurrences.categoryPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? t('common.saving') : t('common.create')}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
