import { useForm } from '@tanstack/react-form'
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
import { useUpdateTransaction } from '@/modules/transactions/api/transactions.queries'
import type { Transaction } from '@/modules/transactions/model/types'

interface EditTransactionInBudgetSheetProps {
  tx: Transaction
  currency: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditTransactionInBudgetSheet({
  tx,
  currency,
  open,
  onOpenChange,
}: EditTransactionInBudgetSheetProps) {
  const { t } = useTranslation()
  const updateMutation = useUpdateTransaction()
  const { data: categories = [] } = useCategories()

  const isIncome = tx.amount > 0

  const form = useForm({
    defaultValues: {
      description: tx.description ?? '',
      amount: Math.abs(tx.amount) as unknown as number,
      type: (isIncome ? 'income' : 'expense') as 'income' | 'expense',
      date: tx.date ? String(tx.date).split('T')[0] : new Date().toISOString().split('T')[0],
      categoryId: tx.categoryId ?? (undefined as string | undefined),
    },
    onSubmit: async ({ value }) => {
      const sign = value.type === 'expense' ? -1 : 1
      await updateMutation.mutateAsync({
        id: tx.id,
        data: {
          description: value.description || undefined,
          amount: Math.round(Math.abs(Number(value.amount)) * sign),
          date: value.date,
          categoryId: value.categoryId || undefined,
        },
      })
      onOpenChange(false)
    },
  })

  // Reset form when tx changes
  React.useEffect(() => {
    form.reset()
  }, [tx.id])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <CrudSheetContent pinnable>
        <CrudSheetHeader
          title={t('budgets.transactions.editTitle')}
          onClose={() => onOpenChange(false)}
          showPing={false}
        />

        <form
          id="edit-tx-form"
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
                      onChange={(e) =>
                        field.handleChange(parseFloat(e.target.value) as unknown as number)
                      }
                      required
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
                      required
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
                        onValueChange={(v) =>
                          field.handleChange((v || undefined) as string | undefined)
                        }
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
          <Button form="edit-tx-form" type="submit" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? t('common.saving') : t('common.save')}
          </Button>
        </CrudSheetActions>
      </CrudSheetContent>
    </Sheet>
  )
}
