'use client'

import * as React from 'react'
import { useFormContext, useFormState, type FieldPath, type FieldValues } from 'react-hook-form'

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName
}

export const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
)

type FormItemContextValue = {
  id: string
}

export const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue)

export function useFormField() {
  const fieldContext = React.useContext(FormFieldContext)
  const itemContext = React.useContext(FormItemContext)
  const formContext = useFormContext()

  // Only call useFormState if we have a context, to avoid unnecessary logs/errors
  // However, hooks must be called unconditionally.
  // react-hook-form's useFormState might log a warning if context is missing.
  const formState = useFormState({
    name: fieldContext?.name,
    disabled: !formContext || !fieldContext?.name,
  })

  const { id } = itemContext

  const fieldState =
    formContext && fieldContext?.name
      ? formContext.getFieldState(fieldContext.name, formState)
      : null

  return {
    id,
    name: fieldContext?.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  }
}
