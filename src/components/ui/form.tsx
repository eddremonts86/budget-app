'use client'

import type { Label as LabelPrimitive } from 'radix-ui'
import { Slot } from 'radix-ui'
import * as React from 'react'
import {
  Controller,
  FormProvider,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { cn } from '@/shared/utils/index'
import { FormFieldContext, FormItemContext, useFormField } from './form-context'

function Form({ ...props }: React.ComponentProps<typeof FormProvider>) {
  return <FormProvider {...props} />
}

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ ...props }: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

function FormItem({ className, ...props }: React.ComponentProps<'div'>) {
  const id = React.useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div data-slot="form-item" className={cn('grid gap-2', className)} {...props} />
    </FormItemContext.Provider>
  )
}

interface FormLabelProps extends React.ComponentProps<typeof LabelPrimitive.Root> {
  error?: boolean
}

function FormLabel({ className, error: propsError, ...props }: FormLabelProps) {
  const { error: contextError, formItemId } = useFormField()
  const error = propsError ?? !!contextError

  return (
    <Label
      data-slot="form-label"
      data-error={error}
      className={cn('data-[error=true]:text-destructive', className)}
      htmlFor={formItemId}
      {...props}
    />
  )
}

interface FormControlProps extends React.ComponentProps<typeof Slot.Root> {
  error?: boolean
}

function FormControl({ error: propsError, ...props }: FormControlProps) {
  const { error: contextError, formItemId, formDescriptionId, formMessageId } = useFormField()
  const error = propsError ?? !!contextError

  return (
    <Slot.Root
      data-slot="form-control"
      id={formItemId}
      aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={error}
      {...props}
    />
  )
}

function FormDescription({ className, ...props }: React.ComponentProps<'p'>) {
  const { formDescriptionId } = useFormField()

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn('text-muted-foreground text-sm', className)}
      {...props}
    />
  )
}

function FormMessage({ className, ...props }: React.ComponentProps<'p'>) {
  const { error: contextError, formMessageId } = useFormField()
  const body = contextError ? String(contextError?.message ?? '') : props.children

  if (!body || (Array.isArray(body) && body.length === 0)) {
    return null
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn('text-destructive text-sm', className)}
      {...props}
    >
      {body}
    </p>
  )
}

export { Form, FormItem, FormLabel, FormControl, FormDescription, FormMessage, FormField }
