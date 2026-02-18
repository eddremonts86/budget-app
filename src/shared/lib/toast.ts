import type { ReactNode } from 'react'
import { sileo } from 'sileo'

export type ToastOptions = {
  description?: string | ReactNode
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
  cancel?: {
    label: string
    onClick: () => void
  }
}

export type PromiseOptions<T> = {
  loading: string | ReactNode
  success: string | ReactNode | ((data: T) => string | ReactNode)
  error: string | ReactNode | ((error: unknown) => string | ReactNode)
}

export interface Toast {
  (message: string, options?: ToastOptions): void
  success: (message: string, options?: ToastOptions) => void
  error: (message: string, options?: ToastOptions) => void
  warning: (message: string, options?: ToastOptions) => void
  info: (message: string, options?: ToastOptions) => void
  message: (message: string, options?: ToastOptions) => void
  promise: <T>(promise: Promise<T> | (() => Promise<T>), options: PromiseOptions<T>) => Promise<T>
}

const showToast = (message: string, options?: ToastOptions) => {
  sileo.show({
    title: message,
    description: options?.description,
    duration: options?.duration,
    button: options?.action
      ? { title: options.action.label, onClick: options.action.onClick }
      : undefined,
  })
}

const success = (message: string, options?: ToastOptions) => {
  sileo.success({
    title: message,
    description: options?.description,
    duration: options?.duration,
    button: options?.action
      ? { title: options.action.label, onClick: options.action.onClick }
      : undefined,
  })
}

const error = (message: string, options?: ToastOptions) => {
  sileo.error({
    title: message,
    description: options?.description,
    duration: options?.duration,
    button: options?.action
      ? { title: options.action.label, onClick: options.action.onClick }
      : undefined,
  })
}

const warning = (message: string, options?: ToastOptions) => {
  sileo.warning({
    title: message,
    description: options?.description,
    duration: options?.duration,
    button: options?.action
      ? { title: options.action.label, onClick: options.action.onClick }
      : undefined,
  })
}

const info = (message: string, options?: ToastOptions) => {
  sileo.info({
    title: message,
    description: options?.description,
    duration: options?.duration,
    button: options?.action
      ? { title: options.action.label, onClick: options.action.onClick }
      : undefined,
  })
}

const promise = <T>(promise: Promise<T> | (() => Promise<T>), options: PromiseOptions<T>) => {
  return sileo.promise(promise, {
    loading: {
      title: typeof options.loading === 'string' ? options.loading : 'Loading...',
    },
    success: (data: T) => {
      const message =
        typeof options.success === 'function' ? options.success(data) : options.success
      return {
        title: typeof message === 'string' ? message : 'Success',
        description: typeof message !== 'string' ? message : undefined,
      }
    },
    error: (error: unknown) => {
      const message = typeof options.error === 'function' ? options.error(error) : options.error
      return {
        title: typeof message === 'string' ? message : 'Error',
        description: typeof message !== 'string' ? message : undefined,
      }
    },
  })
}

export const toast = Object.assign(showToast, {
  success,
  error,
  warning,
  info,
  message: showToast,
  promise,
}) as Toast
