import { useForm } from '@tanstack/react-form'
import * as React from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { Category } from '../model/types'

const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color'),
})

type CategoryFormValues = z.infer<typeof categorySchema>

type CategoryFormProps = {
  defaultValues?: Partial<Category>
  onSubmit: (values: CategoryFormValues) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function CategoryForm({ defaultValues, onSubmit, onCancel, isLoading }: CategoryFormProps) {
  const form = useForm({
    defaultValues: {
      name: defaultValues?.name ?? '',
      color: defaultValues?.color ?? '#000000',
    },
    validators: {
      onChange: categorySchema,
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
              placeholder="Category name"
            />
            <FieldError errors={field.state.meta.errors.map((e) => (typeof e === 'string' ? e : String(e)))} />
          </Field>
        )}
      />

      <form.Field
        name="color"
        children={(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>Color</FieldLabel>
            <div className="flex gap-2">
              <Input
                id={field.name}
                type="color"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                className="w-12 p-1 h-10"
              />
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="#000000"
                className="flex-1"
              />
            </div>
            <FieldError errors={field.state.meta.errors.map((e) => (typeof e === 'string' ? e : String(e)))} />
          </Field>
        )}
      />

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Category'}
        </Button>
      </div>
    </form>
  )
}
