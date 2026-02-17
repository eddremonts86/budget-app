import type { ReactNode } from 'react'
import { sileo } from 'sileo'

type ToastOptions = {
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

type PromiseOptions<T> = {
  loading: string | ReactNode
  success: string | ReactNode | ((data: T) => string | ReactNode)
  error: string | ReactNode | ((error: unknown) => string | ReactNode)
}

const toastBase = (message: string, options?: ToastOptions) => {
  sileo.show({
    title: message,
    description: options?.description,
    duration: options?.duration,
    button: options?.action
      ? { title: options.action.label, onClick: options.action.onClick }
      : undefined,
  })
}

export const toast = Object.assign(toastBase, {
  success: (message: string, options?: ToastOptions) => {
    sileo.success({
      title: message,
      description: options?.description,
      duration: options?.duration,
      button: options?.action
        ? { title: options.action.label, onClick: options.action.onClick }
        : undefined,
    })
  },
  error: (message: string, options?: ToastOptions) => {
    sileo.error({
      title: message,
      description: options?.description,
      duration: options?.duration,
      button: options?.action
        ? { title: options.action.label, onClick: options.action.onClick }
        : undefined,
    })
  },
  warning: (message: string, options?: ToastOptions) => {
    sileo.warning({
      title: message,
      description: options?.description,
      duration: options?.duration,
      button: options?.action
        ? { title: options.action.label, onClick: options.action.onClick }
        : undefined,
    })
  },
  info: (message: string, options?: ToastOptions) => {
    sileo.info({
      title: message,
      description: options?.description,
      duration: options?.duration,
      button: options?.action
        ? { title: options.action.label, onClick: options.action.onClick }
        : undefined,
    })
  },
  message: (message: string, options?: ToastOptions) => {
    sileo.show({
      title: message,
      description: options?.description,
      duration: options?.duration,
      button: options?.action
        ? { title: options.action.label, onClick: options.action.onClick }
        : undefined,
    })
  },
  promise: <T>(promise: Promise<T> | (() => Promise<T>), options: PromiseOptions<T>) => {
    return sileo.promise(promise, {
      loading: {
        title: typeof options.loading === 'string' ? options.loading : 'Loading...',
      },
      success: (data: T) => {
        const msg = typeof options.success === 'function' ? options.success(data) : options.success
        return {
          title: typeof msg === 'string' ? msg : 'Success',
          description: typeof msg !== 'string' ? msg : undefined,
        }
      },
      error: (err: unknown) => {
        const msg = typeof options.error === 'function' ? options.error(err) : options.error
        return {
          title: typeof msg === 'string' ? msg : 'Error',
          description: typeof msg !== 'string' ? msg : undefined,
        }
      },
    })
  },
})
