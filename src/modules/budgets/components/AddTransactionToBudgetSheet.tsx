import { useForm } from '@tanstack/react-form'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import {
  CrudSheetActions,
  CrudSheetBody,
  CrudSheetContent,
  CrudSheetHeader,
  CrudSheetSection,
} from '@/components/ui/crud-sheet'
import { DatePicker } from '@/components/ui/date-picker'
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
import { useCreateTransaction } from '@/modules/transactions/api/transactions.queries'
import { cn } from '@/shared/lib/utils'

interface AddTransactionToBudgetSheetProps {
  budgetId: string
  currency: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddTransactionToBudgetSheet({
  budgetId,
  currency,
  open,
  onOpenChange,
}: AddTransactionToBudgetSheetProps) {
  const { t } = useTranslation()
  const createMutation = useCreateTransaction()
  const { data: categories = [] } = useCategories()

  const form = useForm({
    defaultValues: {
      description: '',
      amount: '' as unknown as number,
      type: 'expense' as 'income' | 'expense',
      date: new Date().toISOString().split('T')[0],
      categoryId: undefined as string | undefined,
    },
    onSubmit: async ({ value }) => {
      const sign = value.type === 'expense' ? -1 : 1
      await createMutation.mutateAsync({
        description: value.description,
        amount: Math.round(value.amount * sign),
        date: value.date,
        categoryId: value.categoryId,
        budgetId,
        status: 'Approved',
        isPrivate: false,
      })
      onOpenChange(false)
      form.reset()
    },
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <CrudSheetContent pinnable>
        <CrudSheetHeader
          title={t('budgets.transactions.addTitle')}
          onClose={() => onOpenChange(false)}
          showPing={false}
        />

        <form
          id="add-tx-form"
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
        >
          <CrudSheetBody>
            <CrudSheetSection>
              <form.Field name="type">
                {(field) => (
                  <div className="flex rounded-lg border overflow-hidden">
                    <button
                      type="button"
                      onClick={() => field.handleChange('expense')}
                      className={cn(
                        'flex-1 py-2 text-xs font-semibold transition-colors',
                        field.state.value === 'expense'
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-r border-red-200 dark:border-red-900'
                          : 'text-muted-foreground hover:bg-muted border-r border-border',
                      )}
                    >
                      ↓ {t('budgets.transactions.expense')}
                    </button>
                    <button
                      type="button"
                      onClick={() => field.handleChange('income')}
                      className={cn(
                        'flex-1 py-2 text-xs font-semibold transition-colors',
                        field.state.value === 'income'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                          : 'text-muted-foreground hover:bg-muted',
                      )}
                    >
                      ↑ {t('budgets.transactions.income')}
                    </button>
                  </div>
                )}
              </form.Field>

              <form.Field name="description">
                {(field) => (
                  <div className="space-y-1">
                    <Label>{t('budgets.transactions.description')}</Label>
                    <Input
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder={t('budgets.transactions.descriptionPlaceholder')}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="amount">
                {(field) => (
                  <div className="space-y-1">
                    <Label>
                      {t('budgets.transactions.amount')} ({currency})
                    </Label>
                    <Input
                      type="number"
                      min={0.01}
                      step={0.01}
                      value={field.state.value as unknown as string}
                      onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="date">
                {(field) => (
                  <div className="space-y-1">
                    <Label>{t('budgets.transactions.date')}</Label>
                    <DatePicker value={field.state.value} onChange={field.handleChange} />
                  </div>
                )}
              </form.Field>

              {categories.length > 0 && (
                <form.Field name="categoryId">
                  {(field) => (
                    <div className="space-y-1">
                      <Label>{t('budgets.transactions.category')}</Label>
                      <Select
                        value={field.state.value ?? ''}
                        onValueChange={(v) => field.handleChange(v || undefined)}
                      >
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('budgets.transactions.categoryPlaceholder')}
                          />
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
                </form.Field>
              )}
            </CrudSheetSection>
          </CrudSheetBody>
        </form>

        <CrudSheetActions>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button form="add-tx-form" type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </CrudSheetActions>
      </CrudSheetContent>
    </Sheet>
  )
}
