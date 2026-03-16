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
import { useProjects } from '@/modules/projects'
import { useCurrentUser, useUsers } from '@/modules/users'
import {
  canApproveTransaction,
  getAssignableApprovers,
  isAdminRole,
} from '@/modules/users/model/permissions'
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
    userId: z.string().min(1, t('validation.required')),
    projectId: z.string().min(1, t('validation.required')),
    assignedAdminId: z.string().min(1, t('validation.required')),
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
  const { data: users = [] } = useUsers()
  const { data: projects = [] } = useProjects()
  const { roleKey, syncedUserId: currentUserId } = useCurrentUser()
  const canEditApprovalStatus = React.useMemo(() => {
    if (defaultValues) {
      return canApproveTransaction(
        {
          status: defaultValues.status,
          assignedAdminId: defaultValues.assignedAdminId ?? null,
        },
        currentUserId,
        roleKey,
      )
    }

    return isAdminRole(roleKey)
  }, [currentUserId, defaultValues, roleKey])

  const approvers = React.useMemo(() => getAssignableApprovers(users), [users])

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
      userId: defaultValues?.userId ?? '',
      projectId: defaultValues?.projectId ?? '',
      assignedAdminId: defaultValues?.assignedAdminId ?? '',
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
      <form.Field name="customer.name">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>{t('transactions.form.customerNameLabel')}</FieldLabel>
            <Input
              id={field.name}
              value={field.state.value}
              disabled={!canEditApprovalStatus}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder={t('transactions.form.customerNamePlaceholder')}
            />
            <FieldError
              errors={field.state.meta.errors.map((e) => (typeof e === 'string' ? e : String(e)))}
            />
          </Field>
        )}
      </form.Field>

      <form.Field name="customer.email">
        {(field) => (
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
      </form.Field>

      <form.Field name="userId">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>{t('transactions.form.userLabel')}</FieldLabel>
            <Select value={field.state.value} onValueChange={field.handleChange}>
              <SelectTrigger id={field.name}>
                <SelectValue placeholder={t('transactions.form.userPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError
              errors={field.state.meta.errors.map((e) => (typeof e === 'string' ? e : String(e)))}
            />
          </Field>
        )}
      </form.Field>

      <form.Field name="projectId">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>{t('transactions.form.projectLabel')}</FieldLabel>
            <Select value={field.state.value} onValueChange={field.handleChange}>
              <SelectTrigger id={field.name}>
                <SelectValue placeholder={t('transactions.form.projectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError
              errors={field.state.meta.errors.map((e) => (typeof e === 'string' ? e : String(e)))}
            />
          </Field>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="amount">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>{t('transactions.form.amountLabel')}</FieldLabel>
              <Input
                id={field.name}
                type="number"
                step="0.01"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(Number(e.target.value))}
                placeholder="0.00"
              />
              <FieldError
                errors={field.state.meta.errors.map((e) => (typeof e === 'string' ? e : String(e)))}
              />
            </Field>
          )}
        </form.Field>

        <form.Field name="date">
          {(field) => (
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
        </form.Field>
      </div>

      <form.Field name="status">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>{t('transactions.form.statusLabel')}</FieldLabel>
            <Select
              value={field.state.value}
              onValueChange={(value) =>
                field.handleChange(value as TransactionFormValues['status'])
              }
              disabled={!canEditApprovalStatus}
            >
              <SelectTrigger id={field.name}>
                <SelectValue placeholder={t('transactions.form.statusPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pending">{t('transactions.form.statusPending')}</SelectItem>
                {canEditApprovalStatus ? (
                  <SelectItem value="Approved">{t('transactions.form.statusApproved')}</SelectItem>
                ) : null}
                {canEditApprovalStatus ? (
                  <SelectItem value="Rejected">{t('transactions.form.statusRejected')}</SelectItem>
                ) : null}
              </SelectContent>
            </Select>
            <FieldError
              errors={field.state.meta.errors.map((e) => (typeof e === 'string' ? e : String(e)))}
            />
          </Field>
        )}
      </form.Field>

      <form.Field name="assignedAdminId">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Assigned Approver</FieldLabel>
            <Select value={field.state.value} onValueChange={field.handleChange}>
              <SelectTrigger id={field.name}>
                <SelectValue placeholder="Select Approver" />
              </SelectTrigger>
              <SelectContent>
                {approvers.map((approver) => (
                  <SelectItem key={approver.id} value={approver.id}>
                    {approver.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError
              errors={field.state.meta.errors.map((e) => (typeof e === 'string' ? e : String(e)))}
            />
          </Field>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border/40">
        <Button type="button" variant="outline" onClick={onCancel}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t('common.loading') : t('common.save')}
        </Button>
      </div>
    </form>
  )
}
