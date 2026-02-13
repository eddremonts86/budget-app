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
import type { User } from '../model/types'

const createUserSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t('validation.required')),
    email: z.string().min(1, t('validation.required')).email(t('validation.invalidEmail')),
    role: z.enum(['admin', 'user']),
    avatar: z.string().min(1, t('validation.required')).url(t('validation.invalidUrl')),
  })

type UserFormValues = z.infer<ReturnType<typeof createUserSchema>>

type UserFormProps = {
  defaultValues?: Partial<User>
  onSubmit: (values: UserFormValues) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function UserForm({ defaultValues, onSubmit, onCancel, isLoading }: UserFormProps) {
  const { t } = useTranslation()
  const initialAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
  const userSchema = React.useMemo(() => createUserSchema(t), [t])

  const form = useForm({
    defaultValues: {
      name: defaultValues?.name ?? '',
      email: defaultValues?.email ?? '',
      role: (defaultValues?.role as UserFormValues['role']) ?? 'user',
      avatar: defaultValues?.avatar ?? initialAvatar,
    },
    validators: {
      onChange: userSchema,
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
        name="name"
        children={(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>{t('users.form.nameLabel')}</FieldLabel>
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder={t('users.form.namePlaceholder')}
            />
            <FieldError
              errors={field.state.meta.errors.map((e) => (typeof e === 'string' ? e : String(e)))}
            />
          </Field>
        )}
      />

      <form.Field
        name="email"
        children={(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>{t('users.form.emailLabel')}</FieldLabel>
            <Input
              id={field.name}
              type="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder={t('users.form.emailPlaceholder')}
            />
            <FieldError
              errors={field.state.meta.errors.map((e) => (typeof e === 'string' ? e : String(e)))}
            />
          </Field>
        )}
      />

      <form.Field
        name="role"
        children={(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>{t('users.form.roleLabel')}</FieldLabel>
            <Select
              value={field.state.value}
              onValueChange={(value) => field.handleChange(value as UserFormValues['role'])}
            >
              <SelectTrigger id={field.name}>
                <SelectValue placeholder={t('users.form.rolePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">{t('users.form.roleUser')}</SelectItem>
                <SelectItem value="admin">{t('users.form.roleAdmin')}</SelectItem>
              </SelectContent>
            </Select>
            <FieldError
              errors={field.state.meta.errors.map((e) => (typeof e === 'string' ? e : String(e)))}
            />
          </Field>
        )}
      />

      <form.Field
        name="avatar"
        children={(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>{t('users.form.avatarLabel')}</FieldLabel>
            <div className="flex gap-2">
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={t('users.form.avatarPlaceholder')}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  field.handleChange(
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
                  )
                }
              >
                {t('users.form.avatarRandom')}
              </Button>
            </div>
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
          {isLoading ? t('common.loading') : t('users.actions.save')}
        </Button>
      </div>
    </form>
  )
}
