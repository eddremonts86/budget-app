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
import type { User } from '../model/types'

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'user']),
  avatar: z.string().url('Invalid avatar URL').or(z.string().min(1, 'Avatar is required')),
})

type UserFormValues = z.infer<typeof userSchema>

type UserFormProps = {
  defaultValues?: Partial<User>
  onSubmit: (values: UserFormValues) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function UserForm({ defaultValues, onSubmit, onCancel, isLoading }: UserFormProps) {
  const initialAvatar = React.useMemo(
    () => `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
    [],
  )

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
            <FieldLabel htmlFor={field.name}>Name</FieldLabel>
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="User name"
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
            <FieldLabel htmlFor={field.name}>Email</FieldLabel>
            <Input
              id={field.name}
              type="email"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="User email"
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
            <FieldLabel htmlFor={field.name}>Role</FieldLabel>
            <Select
              value={field.state.value}
              onValueChange={(value) => field.handleChange(value as UserFormValues['role'])}
            >
              <SelectTrigger id={field.name}>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
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
            <FieldLabel htmlFor={field.name}>Avatar URL</FieldLabel>
            <div className="flex gap-2">
              <Input
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Avatar URL"
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
                Random
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
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save User'}
        </Button>
      </div>
    </form>
  )
}
