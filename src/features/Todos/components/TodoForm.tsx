import { useForm } from '@tanstack/react-form'
import { format } from 'date-fns'
import { da, enUS, es } from 'date-fns/locale'
import { motion } from 'framer-motion'
import {
  Calendar as CalendarIcon,
  Flag,
  ListTodo,
  Loader2,
  MoreHorizontal,
  Save,
  UserCircle,
  X,
} from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { useUsers } from '@/features/Users/api/users.queries'
import { cn } from '@/shared/lib/utils'
import type { Todo } from '../model/types'

const createTodoSchema = (t: (key: string) => string) =>
  z.object({
    title: z.string().min(1, t('validation.required')),
    description: z.string().min(1, t('validation.required')),
    status: z.enum(['pending', 'in_progress', 'completed']),
    priority: z.enum(['low', 'medium', 'high']),
    dueDate: z.string().min(1, t('validation.required')),
    assignedTo: z.string().min(1, t('validation.required')),
  })

type TodoFormValues = z.infer<ReturnType<typeof createTodoSchema>>

type TodoFormProps = {
  defaultValues?: Partial<Todo>
  currentUserId?: string
  onSubmit: (values: TodoFormValues) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function TodoForm({
  defaultValues,
  currentUserId,
  onSubmit,
  onCancel,
  isLoading,
}: TodoFormProps) {
  const { t, i18n } = useTranslation()
  const todoSchema = React.useMemo(() => createTodoSchema(t), [t])
  const { data: users } = useUsers()
  const locale = React.useMemo(() => {
    const language = i18n.language?.toLowerCase() ?? 'en'
    const normalized = language.split('-')[0]
    if (normalized === 'es') return es
    if (normalized === 'dk' || normalized === 'da') return da
    return enUS
  }, [i18n.language])
  const form = useForm({
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      status: (defaultValues?.status as TodoFormValues['status']) ?? 'pending',
      priority: (defaultValues?.priority as TodoFormValues['priority']) ?? 'medium',
      dueDate: defaultValues?.dueDate ?? new Date().toISOString().split('T')[0],
      assignedTo: defaultValues?.assignedTo ?? currentUserId ?? '',
    },
    validators: {
      onChange: todoSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  })

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  }

  return (
    <motion.form
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      onSubmit={(e: React.FormEvent) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="flex flex-col gap-8 min-h-full"
    >
      <div className="flex-1 space-y-8">
        {/* Header Visual Enhancement */}
        <Field className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <ListTodo className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold tracking-tight">
                {t('todos.form.headerTitle')}
              </h3>
              <p className="text-sm text-muted-foreground">{t('todos.form.headerSubtitle')}</p>
            </div>
          </div>
          <Separator className="bg-border/50" />
        </Field>

        <FieldGroup>
          <form.Field
            name="title"
            children={(field) => (
              <motion.div variants={itemVariants}>
                <Field className="space-y-2">
                  <FieldLabel
                    htmlFor={field.name}
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80"
                  >
                    {t('todos.form.titleLabel')}
                  </FieldLabel>
                  <div className="relative group">
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        field.handleChange(e.target.value)
                      }
                      placeholder={t('todos.form.titlePlaceholder')}
                      className="h-12 bg-secondary/30 border-transparent hover:border-primary/30 focus:border-primary transition-all duration-300 rounded-xl px-4 text-base"
                    />
                    <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                  <FieldError
                    errors={field.state.meta.errors.map((e) =>
                      typeof e === 'string' ? e : (e as { message?: string })?.message || String(e),
                    )}
                    className="text-xs font-medium"
                  />
                </Field>
              </motion.div>
            )}
          />

          <form.Field
            name="description"
            children={(field) => (
              <motion.div variants={itemVariants}>
                <Field className="space-y-2">
                  <FieldLabel
                    htmlFor={field.name}
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80"
                  >
                    {t('todos.form.descriptionLabel')}
                  </FieldLabel>
                  <Textarea
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      field.handleChange(e.target.value)
                    }
                    placeholder={t('todos.form.descriptionPlaceholder')}
                    className="min-h-[120px] bg-secondary/30 border-transparent hover:border-primary/30 focus:border-primary transition-all duration-300 rounded-xl p-4 resize-none text-base"
                  />
                  <FieldError
                    errors={field.state.meta.errors.map((e) =>
                      typeof e === 'string' ? e : (e as { message?: string })?.message || String(e),
                    )}
                  />
                </Field>
              </motion.div>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <form.Field
              name="status"
              children={(field) => (
                <motion.div variants={itemVariants}>
                  <Field className="space-y-2">
                    <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                      <MoreHorizontal className="w-3.5 h-3.5" /> {t('todos.form.statusLabel')}
                    </FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(value as TodoFormValues['status'])
                      }
                    >
                      <SelectTrigger className="h-12 bg-secondary/30 border-transparent hover:border-primary/30 transition-all rounded-xl">
                        <SelectValue placeholder={t('todos.form.statusPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/50 shadow-2xl backdrop-blur-xl">
                        <SelectItem value="pending" className="rounded-lg m-1">
                          {t('todos.form.statusPending')}
                        </SelectItem>
                        <SelectItem value="in_progress" className="rounded-lg m-1">
                          {t('todos.form.statusInProgress')}
                        </SelectItem>
                        <SelectItem value="completed" className="rounded-lg m-1">
                          {t('todos.form.statusCompleted')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError
                      errors={field.state.meta.errors.map((e) =>
                        typeof e === 'string'
                          ? e
                          : (e as { message?: string })?.message || String(e),
                      )}
                    />
                  </Field>
                </motion.div>
              )}
            />

            <form.Field
              name="priority"
              children={(field) => (
                <motion.div variants={itemVariants}>
                  <Field className="space-y-2">
                    <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                      <Flag className="w-3.5 h-3.5" /> {t('todos.form.priorityLabel')}
                    </FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(value as TodoFormValues['priority'])
                      }
                    >
                      <SelectTrigger
                        className={cn(
                          'h-12 bg-secondary/30 border-transparent hover:border-primary/30 transition-all rounded-xl',
                          field.state.value === 'high' && 'text-destructive',
                        )}
                      >
                        <SelectValue placeholder={t('todos.form.priorityPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/50 shadow-2xl backdrop-blur-xl">
                        <SelectItem value="low" className="rounded-lg m-1">
                          {t('todos.form.priorityLow')}
                        </SelectItem>
                        <SelectItem value="medium" className="rounded-lg m-1">
                          {t('todos.form.priorityMedium')}
                        </SelectItem>
                        <SelectItem
                          value="high"
                          className="rounded-lg m-1 font-semibold text-destructive"
                        >
                          {t('todos.form.priorityHigh')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError
                      errors={field.state.meta.errors.map((e) =>
                        typeof e === 'string'
                          ? e
                          : (e as { message?: string })?.message || String(e),
                      )}
                    />
                  </Field>
                </motion.div>
              )}
            />
          </div>

          <form.Field
            name="dueDate"
            children={(field) => (
              <motion.div variants={itemVariants}>
                <Field className="space-y-2">
                  <FieldLabel
                    htmlFor={field.name}
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2"
                  >
                    <CalendarIcon className="w-3.5 h-3.5" /> {t('todos.form.dueDateLabel')}
                  </FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'h-12 w-full justify-start text-left font-normal bg-secondary/30 border-transparent hover:border-primary/30 rounded-xl px-4',
                          !field.state.value && 'text-muted-foreground',
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
                        {field.state.value ? (
                          format(new Date(`${field.state.value}T00:00:00`), 'PPP', { locale })
                        ) : (
                          <span>{t('todos.form.dueDatePlaceholder')}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 rounded-2xl border-border/40 shadow-2xl"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={
                          field.state.value ? new Date(`${field.state.value}T00:00:00`) : undefined
                        }
                        onSelect={(date) => {
                          if (!date) return
                          const year = date.getFullYear()
                          const month = String(date.getMonth() + 1).padStart(2, '0')
                          const day = String(date.getDate()).padStart(2, '0')
                          field.handleChange(`${year}-${month}-${day}`)
                        }}
                        initialFocus
                        locale={locale}
                        className="rounded-2xl"
                      />
                    </PopoverContent>
                  </Popover>
                  <FieldError
                    errors={field.state.meta.errors.map((e) =>
                      typeof e === 'string' ? e : (e as { message?: string })?.message || String(e),
                    )}
                  />
                </Field>
              </motion.div>
            )}
          />

          <form.Field
            name="assignedTo"
            children={(field) => (
              <motion.div variants={itemVariants}>
                <Field className="space-y-2">
                  <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                    <UserCircle className="w-3.5 h-3.5" /> {t('todos.form.assignedToLabel')}
                  </FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(value) => field.handleChange(value)}
                  >
                    <SelectTrigger className="h-12 bg-secondary/30 border-transparent hover:border-primary/30 transition-all rounded-xl">
                      <SelectValue placeholder={t('todos.form.assignedToPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-border/50 shadow-2xl backdrop-blur-xl">
                      {users?.map((user) => (
                        <SelectItem key={user.id} value={user.id} className="rounded-lg m-1">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={user.avatar} alt={user.name} />
                              <AvatarFallback className="text-[10px]">
                                {user.name.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span>
                              {user.id === currentUserId
                                ? `${user.name} (${t('todos.form.assignedToSelf')})`
                                : user.name}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError
                    errors={field.state.meta.errors.map((e) =>
                      typeof e === 'string' ? e : (e as { message?: string })?.message || String(e),
                    )}
                  />
                </Field>
              </motion.div>
            )}
          />
        </FieldGroup>
      </div>

      <motion.div
        variants={itemVariants}
        className="pt-6 border-t border-border/50 mt-auto sticky bottom-0 bg-background pb-4 z-10"
      >
        <Field className="flex items-center justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="rounded-xl px-6 hover:bg-secondary/50 transition-colors"
          >
            <X className="w-4 h-4 mr-2" />
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="rounded-xl px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('common.loading')}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {defaultValues?.id ? t('todos.actions.update') : t('todos.actions.create')}
              </div>
            )}
          </Button>
        </Field>
      </motion.div>
    </motion.form>
  )
}
