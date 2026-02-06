import { useForm } from '@tanstack/react-form'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import {
  Button,
  DatePicker,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@/components/ui'
import { useCreateTodo } from '@/features/ToDo/api'
import type { TodoPriority, TodoStatus } from '../types/todo.types'

// Form-specific schema with all required fields
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used for type inference
const formSchema = z.object({
  title: z.string().min(3).max(100),
  description: z.string().max(500),
  status: z.enum(['pending', 'in_progress', 'completed']),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string().refine((date) => new Date(date) > new Date(), {
    message: 'validation.futureDate',
  }),
})

type FormValues = z.infer<typeof formSchema>

interface TodoFormProps {
  onSuccess?: () => void
}

export function TodoForm({ onSuccess }: TodoFormProps) {
  const { t } = useTranslation()
  const createTodo = useCreateTodo()

  const form = useForm({
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium' as TodoPriority,
      status: 'pending' as TodoStatus,
      // eslint-disable-next-line react-hooks/purity
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    } as FormValues,
    onSubmit: async ({ value }) => {
      await createTodo.mutateAsync(value)
      form.reset()
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
      className="space-y-4"
    >
      {/* Title */}
      <form.Field name="title">
        {(field) => (
          <div className="space-y-1">
            <Label htmlFor={field.name}>{t('todo.fields.title')} *</Label>
            <Input
              id={field.name}
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
            <Label htmlFor={field.name}>{t('todo.fields.description')}</Label>
            <Textarea
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              rows={3}
              placeholder={t('todo.fields.description')}
            />
          </div>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-4">
        {/* Priority */}
        <form.Field name="priority">
          {(field) => (
            <div className="space-y-1">
              <Label htmlFor={field.name}>{t('todo.fields.priority')}</Label>
              <Select
                value={field.state.value}
                onValueChange={(value: string) => field.handleChange(value as TodoPriority)}
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder={t('todo.fields.priority')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('todo.priority.low')}</SelectItem>
                  <SelectItem value="medium">{t('todo.priority.medium')}</SelectItem>
                  <SelectItem value="high">{t('todo.priority.high')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        {/* Status */}
        <form.Field name="status">
          {(field) => (
            <div className="space-y-1">
              <Label htmlFor={field.name}>{t('todo.fields.status')}</Label>
              <Select
                value={field.state.value}
                onValueChange={(value: string) => field.handleChange(value as TodoStatus)}
              >
                <SelectTrigger id={field.name}>
                  <SelectValue placeholder={t('todo.fields.status')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">{t('todo.status.pending')}</SelectItem>
                  <SelectItem value="in_progress">{t('todo.status.in_progress')}</SelectItem>
                  <SelectItem value="completed">{t('todo.status.completed')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        {/* Due Date */}
        <form.Field name="dueDate">
          {(field) => (
            <div className="space-y-1">
              <Label>{t('todo.fields.dueDate')}</Label>
              <DatePicker value={field.state.value} onChange={field.handleChange} />
              {field.state.meta.isTouched && new Date(field.state.value) <= new Date() && (
                <p className="text-xs text-destructive">{t('validation.futureDate')}</p>
              )}
            </div>
          )}
        </form.Field>
      </div>

      {/* Submit */}
      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <Button type="submit" disabled={!canSubmit || isSubmitting} className="w-full">
            {isSubmitting ? t('common.loading') : t('todo.createNew')}
          </Button>
        )}
      </form.Subscribe>
    </form>
  )
}
