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
                  <div className="space-y-1">
                    <Label>{t('budgets.transactions.type')}</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={(v) => field.handleChange(v as 'income' | 'expense')}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">{t('budgets.transactions.expense')}</SelectItem>
                        <SelectItem value="income">{t('budgets.transactions.income')}</SelectItem>
                      </SelectContent>
                    </Select>
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
                    <Input
                      type="date"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
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
