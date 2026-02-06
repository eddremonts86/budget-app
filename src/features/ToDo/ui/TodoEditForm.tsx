import { useForm } from '@tanstack/react-form'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/shared/components/ui/button'
import { Combobox } from '@/shared/components/ui/combobox'
import { DatePicker } from '@/shared/components/ui/date-picker'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { useUpdateTodo } from '@/features/ToDo/api'
import type { Todo, TodoPriority, TodoStatus } from '@/features/ToDo/model'

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used for type inference
const formSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500),
  status: z.enum(['pending', 'in_progress', 'completed']),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string(),
})

type FormValues = z.infer<typeof formSchema>

interface TodoEditFormProps {
  todo: Todo
  onSuccess?: () => void
  onCancel?: () => void
}

export function TodoEditForm({ todo, onSuccess, onCancel }: TodoEditFormProps) {
  const { t } = useTranslation()
  const updateTodo = useUpdateTodo()

  const form = useForm({
    defaultValues: {
      title: todo.title,
      description: todo.description,
      priority: todo.priority,
      status: todo.status,
      dueDate: todo.dueDate,
    } as FormValues,
    onSubmit: async ({ value }) => {
      await updateTodo.mutateAsync({ id: todo.id, ...value })
      onSuccess?.()
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="border-b p-6 bg-muted/30 space-y-4 animate-in fade-in duration-200"
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold">{t('todo.editTodo')}</h4>
        {onCancel && (
          <Button
            type="button"
            onClick={onCancel}
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            aria-label={t('common.cancel')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Title */}
      <form.Field name="title">
        {(field) => (
          <div className="space-y-1">
            <Label htmlFor={`${todo.id}-${field.name}`}>{t('todo.fields.title')} *</Label>
            <Input
              id={`${todo.id}-${field.name}`}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder={t('todo.fields.title')}
              className={
                field.state.meta.isTouched && field.state.value.length < 3
                  ? 'border-destructive'
                  : ''
              }
            />
            {field.state.meta.isTouched && field.state.value.length < 3 && (
              <p className="text-xs text-destructive">{t('validation.minLength', { min: 3 })}</p>
            )}
          </div>
        )}
      </form.Field>

      {/* Description */}
      <form.Field name="description">
        {(field) => (
          <div className="space-y-1">
            <Label htmlFor={`${todo.id}-${field.name}`}>{t('todo.fields.description')}</Label>
            <Textarea
              id={`${todo.id}-${field.name}`}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              rows={2}
              placeholder={t('todo.fields.description')}
            />
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-3 gap-3">
        {/* Status */}
        <form.Field name="status">
          {(field) => (
            <div className="space-y-1">
              <Label>{t('todo.fields.status')}</Label>
              <Combobox
                value={field.state.value}
                onChange={(value) => field.handleChange(value as TodoStatus)}
                options={[
                  { label: t('todo.status.pending'), value: 'pending' },
                  { label: t('todo.status.in_progress'), value: 'in_progress' },
                  { label: t('todo.status.completed'), value: 'completed' },
                ]}
              />
            </div>
          )}
        </form.Field>

        {/* Priority */}
        <form.Field name="priority">
          {(field) => (
            <div className="space-y-1">
              <Label>{t('todo.fields.priority')}</Label>
              <Combobox
                value={field.state.value}
                onChange={(value) => field.handleChange(value as TodoPriority)}
                options={[
                  { label: t('todo.priority.low'), value: 'low' },
                  { label: t('todo.priority.medium'), value: 'medium' },
                  { label: t('todo.priority.high'), value: 'high' },
                ]}
              />
            </div>
          )}
        </form.Field>

        {/* Due Date */}
        <form.Field name="dueDate">
          {(field) => (
            <div className="space-y-1">
              <Label>{t('todo.fields.dueDate')}</Label>
              <DatePicker value={field.state.value} onChange={field.handleChange} />
            </div>
          )}
        </form.Field>
      </div>

      {/* Actions */}
      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={!canSubmit || isSubmitting} className="flex-1">
              {isSubmitting ? t('common.loading') : t('common.save')}
            </Button>
            {onCancel && (
              <Button type="button" onClick={onCancel} variant="secondary">
                {t('common.cancel')}
              </Button>
            )}
          </div>
        )}
      </form.Subscribe>
    </form>
  )
}
