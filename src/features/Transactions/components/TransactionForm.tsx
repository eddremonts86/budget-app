import { useForm } from '@tanstack/react-form'
import * as React from 'react'
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

const transactionSchema = z.object({
  customer: z.object({
    name: z.string().min(1, 'Customer name is required'),
    email: z.string().email('Invalid customer email'),
  }),
  status: z.enum(['Approved', 'Pending', 'Rejected']),
  date: z.string().min(1, 'Date is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
})

type TransactionFormValues = z.infer<typeof transactionSchema>

type TransactionFormProps = {
  defaultValues?: Partial<Transaction>
  onSubmit: (values: TransactionFormValues) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function TransactionForm({ defaultValues, onSubmit, onCancel, isLoading }: TransactionFormProps) {
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
            <FieldLabel htmlFor={field.name}>Customer Name</FieldLabel>
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Customer name"
            />
            <FieldError errors={field.state.meta.errors.map((e) => (typeof e === 'string' ? e : String(e)))} />
          </Field>
        )}
      />

      <form.Field
        name="customer.email"
        children={(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Customer Email</FieldLabel>
            <Input
              id={field.name}
              type="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Customer email"
            />
            <FieldError errors={field.state.meta.errors.map((e) => (typeof e === 'string' ? e : String(e)))} />
          </Field>
        )}
      />

      <div className="grid grid-cols-2 gap-4">
        <form.Field
          name="status"
          children={(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Status</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(value) => field.handleChange(value as TransactionFormValues['status'])}
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <FieldError errors={field.state.meta.errors.map((e) => (typeof e === 'string' ? e : String(e)))} />
            </Field>
          )}
        />

        <form.Field
          name="amount"
          children={(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Amount</FieldLabel>
              <Input
                id={field.name}
                type="number"
                step="0.01"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(Number(e.target.value))}
                placeholder="0.00"
              />
              <FieldError errors={field.state.meta.errors.map((e) => (typeof e === 'string' ? e : String(e)))} />
            </Field>
          )}
        />
      </div>

      <form.Field
        name="date"
        children={(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Date</FieldLabel>
            <Input
              id={field.name}
              type="date"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            <FieldError errors={field.state.meta.errors.map((e) => (typeof e === 'string' ? e : String(e)))} />
          </Field>
        )}
      />

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Transaction'}
        </Button>
      </div>
    </form>
  )
}
