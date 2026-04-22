import { useForm } from '@tanstack/react-form'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import { DatePicker } from '@/components/ui/date-picker'
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
import { useCurrentUser, useUserDirectory, useUsersByIds } from '@/modules/users'
import type { User } from '@/modules/users'
import {
  canApproveTransaction,
  getAssignableApprovers,
  isAdminRole,
} from '@/modules/users/model/permissions'
import { getFieldError } from '@/shared/lib/utils'
import type { Transaction } from '../model/types'

const createTransactionSchema = (t: (key: string) => string) =>
  z.object({
    customer: z.object({
      name: z.string().min(1, t('validation.required')),
      email: z.string().min(1, t('validation.required')).email(t('validation.invalidEmail')),
    }),
    status: z.enum(['Approved', 'Pending', 'Rejected']),
    date: z.string().min(1, t('validation.required')),
    amount: z.number().min(0.01, t('validation.minAmount')),
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
  const { data: projects = [] } = useProjects()
  const { roleKey, syncedUserId: currentUserId } = useCurrentUser()
  const [userSearch, setUserSearch] = React.useState('')
  const [approverSearch, setApproverSearch] = React.useState('')
  const [lookupUserIds, setLookupUserIds] = React.useState<string[]>(() =>
    [defaultValues?.userId, defaultValues?.assignedAdminId].filter((value): value is string =>
      Boolean(value),
    ),
  )
  const { data: selectedUsers = [] } = useUsersByIds(lookupUserIds)
  const { data: userDirectory = [] } = useUserDirectory(
    userSearch.trim() || undefined,
    userSearch.trim() ? 50 : 25,
  )
  const { data: approverDirectory = [] } = useUserDirectory(
    approverSearch.trim() || undefined,
    approverSearch.trim() ? 50 : 25,
  )
  const canEditApprovalStatus = React.useMemo(() => {
    if (defaultValues) {
      return canApproveTransaction(
        {
          status: defaultValues.status ?? 'Pending',
          assignedAdminId: defaultValues.assignedAdminId ?? null,
        },
        currentUserId,
        roleKey,
      )
    }

    return isAdminRole(roleKey)
  }, [currentUserId, defaultValues, roleKey])

  const selectableUsers = React.useMemo(() => {
    const usersById = new Map<string, User>()

    for (const user of selectedUsers) {
      usersById.set(user.id, user)
    }

    for (const user of userDirectory) {
      usersById.set(user.id, user)
    }

    return [...usersById.values()]
  }, [selectedUsers, userDirectory])

  const approvers = React.useMemo(() => {
    const usersById = new Map<string, User>()
    const mergedUsers = [...selectedUsers, ...approverDirectory]

    for (const user of getAssignableApprovers(mergedUsers)) {
      usersById.set(user.id, user)
    }

    return [...usersById.values()]
  }, [approverDirectory, selectedUsers])

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
            <FieldError errors={field.state.meta.errors.map((e) => getFieldError(e))} />
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
            <FieldError errors={field.state.meta.errors.map((e) => getFieldError(e))} />
          </Field>
        )}
      </form.Field>

      <form.Field name="userId">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>{t('transactions.form.userLabel')}</FieldLabel>
            <Combobox
              value={field.state.value}
              onValueChange={(value) => {
                const nextValue = String(value)
                field.handleChange(nextValue)
                setLookupUserIds((prev) =>
                  Array.from(
                    new Set([...prev.filter((id) => id !== field.state.value), nextValue]),
                  ),
                )
              }}
            >
              <ComboboxInput
                placeholder={t('transactions.form.userPlaceholder')}
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                showClear
              />
              <ComboboxContent>
                <ComboboxEmpty>
                  {t('team.emptyUsers', { defaultValue: 'No users available.' })}
                </ComboboxEmpty>
                <ComboboxList>
                  {selectableUsers.map((user) => (
                    <ComboboxItem key={user.id} value={user.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <FieldError errors={field.state.meta.errors.map((e) => getFieldError(e))} />
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
            <FieldError errors={field.state.meta.errors.map((e) => getFieldError(e))} />
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
              <FieldError errors={field.state.meta.errors.map((e) => getFieldError(e))} />
            </Field>
          )}
        </form.Field>

        <form.Field name="date">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>{t('transactions.form.dateLabel')}</FieldLabel>
              <DatePicker value={field.state.value} onChange={field.handleChange} />
              <FieldError errors={field.state.meta.errors.map((e) => getFieldError(e))} />
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
            <FieldError errors={field.state.meta.errors.map((e) => getFieldError(e))} />
          </Field>
        )}
      </form.Field>

      <form.Field name="assignedAdminId">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>
              {t('transactions.form.assignedAdminLabel', { defaultValue: 'Assigned Approver' })}
            </FieldLabel>
            <Combobox
              value={field.state.value}
              onValueChange={(value) => {
                const nextValue = String(value)
                field.handleChange(nextValue)
                setLookupUserIds((prev) =>
                  Array.from(
                    new Set([...prev.filter((id) => id !== field.state.value), nextValue]),
                  ),
                )
              }}
            >
              <ComboboxInput
                placeholder={t('transactions.form.assignedAdminPlaceholder', {
                  defaultValue: 'Select approver',
                })}
                value={approverSearch}
                onChange={(event) => setApproverSearch(event.target.value)}
                showClear
              />
              <ComboboxContent>
                <ComboboxEmpty>
                  {t('transactions.form.noApprovers', { defaultValue: 'No approvers available.' })}
                </ComboboxEmpty>
                <ComboboxList>
                  {approvers.map((approver) => (
                    <ComboboxItem key={approver.id} value={approver.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{approver.name}</span>
                        <span className="text-xs text-muted-foreground">{approver.email}</span>
                      </div>
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <FieldError errors={field.state.meta.errors.map((e) => getFieldError(e))} />
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
