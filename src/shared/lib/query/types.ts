import type {
  InfiniteData,
  MutationFunction,
  QueryFunction,
  QueryKey,
  UseInfiniteQueryOptions,
  UseMutationOptions,
  UseQueryOptions,
  UseSuspenseQueryOptions,
} from '@tanstack/react-query'
import type { CacheProfile } from './query-config'

/**
 * Extended options for useTQuery wrapper
 */
export interface TQueryOptions<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
> extends Omit<UseQueryOptions<TQueryFnData, TError, TData>, 'queryKey' | 'queryFn'> {
  /** Cache profile to apply. Default: 'standard' */
  cache?: CacheProfile
}

/**
 * Extended options for useTQSuspense wrapper
 */
export interface TQSuspenseOptions<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
> extends Omit<UseSuspenseQueryOptions<TQueryFnData, TError, TData>, 'queryKey' | 'queryFn'> {
  /** Cache profile to apply. Default: 'standard' */
  cache?: CacheProfile
}

/**
 * Extended options for useTQMutation wrapper
 */
export interface TQMutationOptions<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
> extends Omit<
  UseMutationOptions<TData, TError, TVariables, TContext>,
  'mutationKey' | 'mutationFn'
> {
  /** Message to show on successful mutation */
  successMessage?: string | ((data: TData) => string)
  /** Override default error message */
  errorMessage?: string
  /** Show success toast. Default: true */
  showSuccessToast?: boolean
  /** Query keys to invalidate after successful mutation */
  invalidateKeys?: QueryKey[]
  /** Enable optimistic updates */
  optimistic?: boolean
}

/**
 * Extended options for useTQInfinite wrapper
 */
export interface TQInfiniteOptions<
  TQueryFnData = unknown,
  TError = Error,
  TData = InfiniteData<TQueryFnData>,
  TPageParam = unknown,
> extends Omit<
  UseInfiniteQueryOptions<TQueryFnData, TError, TData, QueryKey, TPageParam>,
  'queryKey' | 'queryFn'
> {
  /** Cache profile to apply. Default: 'standard' */
  cache?: CacheProfile
}

export type { QueryKey, QueryFunction, MutationFunction }
