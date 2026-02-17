import {
  type MutationFunction,
  type MutationKey,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { toast } from '@/shared/lib/toast'
import type { TQMutationOptions } from './types'

/**
 * Wrapper around useMutation with unified success/error handling
 *
 * @example
 * ```tsx
 * const createTodo = useTQMutation(
 *   ['todos', 'create'],
 *   todoApi.create,
 *   {
 *     invalidateKeys: [['todos', 'list']],
 *     successMessage: 'Todo created successfully',
 *   }
 * )
 *
 * // Usage
 * createTodo.mutate({ title: 'New Todo', priority: 'high' })
 * ```
 */
export function useTQMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  mutationKey: MutationKey,
  mutationFn: MutationFunction<TData, TVariables>,
  options?: TQMutationOptions<TData, TError, TVariables, TContext>,
) {
  const queryClient = useQueryClient()

  const {
    successMessage,
    showSuccessToast = true,
    invalidateKeys,
    onSuccess,
    onError,
    ...restOptions
  } = options ?? {}

  return useMutation<TData, TError, TVariables, TContext>({
    mutationKey,
    mutationFn,
    onSuccess: (data, variables, onMutateResult, context) => {
      // Show success toast if configured
      if (showSuccessToast && successMessage) {
        const message = typeof successMessage === 'function' ? successMessage(data) : successMessage
        toast.success(message)
      }

      // Invalidate related queries
      if (invalidateKeys?.length) {
        for (const key of invalidateKeys) {
          queryClient.invalidateQueries({ queryKey: key })
        }
      }

      // Call original onSuccess
      onSuccess?.(data, variables, onMutateResult, context)
    },
    onError: (error, variables, onMutateResult, context) => {
      // Error toast is already handled by axios interceptor
      // Call original onError
      onError?.(error, variables, onMutateResult, context)
    },
    ...restOptions,
  })
}
