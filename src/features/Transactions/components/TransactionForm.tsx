import { useForm } from '@tanstack/react-form'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Transaction } from '../model/types'

const createTransactionSchema = (t: (key: string) => string) =>
  z.object({
    customer: z.object({
      name: z.string().min(1, t('validation.required')),
      email: z.string().min(1, t('validation.required')).email(t('validation.invalidEmail')),
    }),
    status: z.enum(['Approved', 'Pending', 'Rejected']),
    date: z.string().min(1, t('validation.required')),
    amount: z.coerce.number().min(0.01, t('validation.minAmount')),
  })

type TransactionFormValues = z.infer<ReturnType<typeof createTransactionSchema>>

type TransactionFormProps = {
  defaultValues?: Partial<Transaction>
  onSubmit: (values: TransactionFormValues) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function TransactionForm({
  defaultValues,
  onSubmit,
  onCancel,
  isLoading,
}: TransactionFormProps) {
  const { t } = useTranslation()
  const transactionSchema = React.useMemo(() => createTransactionSchema(t), [t])
  const form = useForm({
    defaultValues: {
      customer: {
        name: defaultValues?.customer?.name ?? '',
        email: defaultValues?.customer?.email ?? '',
      },
      status: (defaultValues?.status as TransactionFormValues['status']) ?? 'Pending',
      date: defaultValues?.date ?? new Date().toISOString().split('T')[0],
      amount: defaultValues?.amount ?? 0,
    },
    validators: {
      onChange: transactionSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      <form.Field
        name="customer.name"
        children={(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>{t('transactions.form.customerNameLabel')}</FieldLabel>
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder={t('transactions.form.customerNamePlaceholder')}
            />
            <FieldError
              errors={field.state.meta.errors.map((e) => (typeof e === 'string' ? e : String(e)))}
            />
          </Field>
        )}
      />

      <form.Field
        name="customer.email"
        children={(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>
              {t('transactions.form.customerEmailLabel')}
            </FieldLabel>
            <Input
              id={field.name}
              type="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder={t('transactions.form.customerEmailPlaceholder')}
            />
            <FieldError
              errors={field.state.meta.errors.map((e) => (typeof e === 'string' ? e : String(e)))}
            />
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <form.Field
          name="status"
          children={(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>{t('transactions.form.statusLabel')}</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as TransactionFormValues['status'])
                }
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder={t('transactions.form.statusPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Approved">{t('transactions.status.approved')}</SelectItem>
                  <SelectItem value="Pending">{t('transactions.status.pending')}</SelectItem>
                  <SelectItem value="Rejected">{t('transactions.status.rejected')}</SelectItem>
                </SelectContent>
              </Select>
              <FieldError
                errors={field.state.meta.errors.map((e) => (typeof e === 'string' ? e : String(e)))}
              />
            </Field>
          )}
        />

        <form.Field
          name="amount"
          children={(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>{t('transactions.form.amountLabel')}</FieldLabel>
              <Input
                id={field.name}
                type="number"
                step="0.01"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(Number(e.target.value))}
                placeholder={t('transactions.form.amountPlaceholder')}
              />
              <FieldError
                errors={field.state.meta.errors.map((e) => (typeof e === 'string' ? e : String(e)))}
              />
            </Field>
          )}
        />
      </div>

      <form.Field
        name="date"
        children={(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>{t('transactions.form.dateLabel')}</FieldLabel>
            <Input
              id={field.name}
              type="date"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldError
              errors={field.state.meta.errors.map((e) => (typeof e === 'string' ? e : String(e)))}
            />
          </Field>
        )}
      />

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t('common.loading') : t('transactions.actions.save')}
        </Button>
      </div>
    </form>
  )
}
