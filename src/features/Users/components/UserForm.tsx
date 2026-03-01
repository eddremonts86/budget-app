import { useForm } from '@tanstack/react-form'
import { RefreshCw } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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

export type UserFormValues = z.infer<ReturnType<typeof createUserSchema>>

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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                field.handleChange(e.target.value)
              }
              placeholder={t('users.form.namePlaceholder')}
            />
            <FieldError
              errors={field.state.meta.errors.map((e) => {
                if (typeof e === 'string') return e
                if (e && typeof e === 'object' && 'message' in e)
                  return String((e as { message: string }).message)
                return String(e)
              })}
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                field.handleChange(e.target.value)
              }
              placeholder={t('users.form.emailPlaceholder')}
            />
            <FieldError
              errors={field.state.meta.errors.map((e) => {
                if (typeof e === 'string') return e
                if (e && typeof e === 'object' && 'message' in e)
                  return String((e as { message: string }).message)
                return String(e)
              })}
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
              onValueChange={(value: string) => field.handleChange(value as UserFormValues['role'])}
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
              errors={field.state.meta.errors.map((e) => {
                if (typeof e === 'string') return e
                if (e && typeof e === 'object' && 'message' in e)
                  return String((e as { message: string }).message)
                return String(e)
              })}
            />
          </Field>
        )}
      />

      <form.Field
        name="avatar"
        children={(field) => (
          <Field className="space-y-3">
            <FieldLabel htmlFor={field.name}>{t('users.form.avatarLabel')}</FieldLabel>
            <div className="flex items-start gap-4 p-4 rounded-xl border border-border/40 bg-muted/5">
              <Avatar className="h-16 w-16 border-2 border-background shadow-sm ring-1 ring-border/10">
                <AvatarImage
                  src={field.state.value}
                  alt="Avatar preview"
                  className="object-cover"
                />
                <form.Subscribe selector={(state) => state.values.name}>
                  {(name) => (
                    <AvatarFallback className="bg-primary/5 text-primary text-lg font-bold">
                      {((name as string) || '?').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  )}
                </form.Subscribe>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Input
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      field.handleChange(e.target.value)
                    }
                    placeholder={t('users.form.avatarPlaceholder')}
                    className="font-mono text-xs"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0"
                    onClick={() =>
                      field.handleChange(
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
                      )
                    }
                    disabled={isLoading}
                    title={t('users.form.avatarRandom')}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {t('users.form.avatarHelp') || 'Paste a URL or generate a random avatar'}
                </p>
              </div>
            </div>
            <FieldError
              errors={field.state.meta.errors.map((e) => {
                if (typeof e === 'string') return e
                if (e && typeof e === 'object' && 'message' in e)
                  return String((e as { message: string }).message)
                return String(e)
              })}
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
