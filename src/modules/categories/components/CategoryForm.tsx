import { useForm } from '@tanstack/react-form'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { getFieldError } from '@/shared/lib/utils'
import type { Category } from '../model/types'

const createCategorySchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t('validation.required')),
    color: z.string().regex(/^#[0-9A-F]{6}$/i, t('validation.invalidColor')),
  })

type CategoryFormValues = z.infer<ReturnType<typeof createCategorySchema>>

type CategoryFormProps = {
  defaultValues?: Partial<Category>
  onSubmit: (values: CategoryFormValues) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function CategoryForm({ defaultValues, onSubmit, onCancel, isLoading }: CategoryFormProps) {
  const { t } = useTranslation()
  const categorySchema = React.useMemo(() => createCategorySchema(t), [t])
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
      <form.Field name="name">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>{t('categories.nameLabel')}</FieldLabel>
            <Input
              id={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder={t('categories.namePlaceholder')}
            />
            <FieldError errors={field.state.meta.errors.map(getFieldError)} />
          </Field>
        )}
      </form.Field>

      <form.Field name="color">
        {(field) => (
          <Field>
            <FieldLabel htmlFor={field.name}>{t('categories.colorLabel')}</FieldLabel>
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
            <FieldError errors={field.state.meta.errors.map(getFieldError)} />
          </Field>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-3 pt-6 border-t border-border/40 mt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isLoading} className="shadow-lg shadow-primary/20">
          {isLoading ? (
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {t('common.loading')}
            </div>
          ) : defaultValues ? (
            t('common.save')
          ) : (
            t('common.create')
          )}
        </Button>
      </div>
    </form>
  )
}
