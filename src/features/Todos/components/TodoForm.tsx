import { useForm } from '@tanstack/react-form'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { motion } from 'framer-motion'
import {
  Calendar as CalendarIcon,
  Flag,
  ListTodo,
  Loader2,
  MoreHorizontal,
  Save,
  X,
} from 'lucide-react'
import * as React from 'react'
import { z } from 'zod'
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
import { cn } from '@/shared/lib/utils'
import type { Todo } from '../model/types'

const todoSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().min(1, 'La descripción es obligatoria'),
  status: z.enum(['pending', 'in_progress', 'completed']),
  priority: z.enum(['low', 'medium', 'high']),
  dueDate: z.string().min(1, 'La fecha es obligatoria'),
})

type TodoFormValues = z.infer<typeof todoSchema>

type TodoFormProps = {
  defaultValues?: Partial<Todo>
  onSubmit: (values: TodoFormValues) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function TodoForm({ defaultValues, onSubmit, onCancel, isLoading }: TodoFormProps) {
  const form = useForm({
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      status: (defaultValues?.status as TodoFormValues['status']) ?? 'pending',
      priority: (defaultValues?.priority as TodoFormValues['priority']) ?? 'medium',
      dueDate: defaultValues?.dueDate ?? new Date().toISOString().split('T')[0],
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
              <h3 className="text-lg font-semibold tracking-tight">Detalles de la Tarea</h3>
              <p className="text-sm text-muted-foreground">
                Define los objetivos y tiempos de entrega.
              </p>
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
                    Título del Proyecto
                  </FieldLabel>
                  <div className="relative group">
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        field.handleChange(e.target.value)
                      }
                      placeholder="Ej: Rediseño de Dashboard"
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
                    Descripción Detallada
                  </FieldLabel>
                  <Textarea
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      field.handleChange(e.target.value)
                    }
                    placeholder="Describe los pasos a seguir..."
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
                      <MoreHorizontal className="w-3.5 h-3.5" /> Estado Actual
                    </FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(value as TodoFormValues['status'])
                      }
                    >
                      <SelectTrigger className="h-12 bg-secondary/30 border-transparent hover:border-primary/30 transition-all rounded-xl">
                        <SelectValue placeholder="Seleccionar estado" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/50 shadow-2xl backdrop-blur-xl">
                        <SelectItem value="pending" className="rounded-lg m-1">
                          Pendiente
                        </SelectItem>
                        <SelectItem value="in_progress" className="rounded-lg m-1">
                          En Progreso
                        </SelectItem>
                        <SelectItem value="completed" className="rounded-lg m-1">
                          Completada
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
                      <Flag className="w-3.5 h-3.5" /> Prioridad
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
                        <SelectValue placeholder="Seleccionar prioridad" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-border/50 shadow-2xl backdrop-blur-xl">
                        <SelectItem value="low" className="rounded-lg m-1">
                          Baja
                        </SelectItem>
                        <SelectItem value="medium" className="rounded-lg m-1">
                          Media
                        </SelectItem>
                        <SelectItem
                          value="high"
                          className="rounded-lg m-1 font-semibold text-destructive"
                        >
                          Alta
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
                    <CalendarIcon className="w-3.5 h-3.5" /> Fecha de Entrega
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
                          format(new Date(`${field.state.value}T00:00:00`), 'PPP', { locale: es })
                        ) : (
                          <span>Seleccionar fecha</span>
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
                        locale={es}
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
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="rounded-xl px-8 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {defaultValues?.id ? 'Actualizar Tarea' : 'Crear Tarea'}
              </div>
            )}
          </Button>
        </Field>
      </motion.div>
    </motion.form>
  )
}
