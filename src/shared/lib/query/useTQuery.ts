import { type QueryFunction, type QueryKey, useQuery } from '@tanstack/react-query'
import { cacheProfiles } from './query-config'
import type { TQueryOptions } from './types'

/**
 * Wrapper around useQuery with unified cache configuration
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useTQuery(
 *   ['todos', filters],
 *   () => todoApi.getAll(filters),
 *   { cache: 'standard' }
 * )
 * ```
 */
export function useTQuery<TQueryFnData = unknown, TError = Error, TData = TQueryFnData>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TQueryFnData>,
  options?: TQueryOptions<TQueryFnData, TError, TData>,
) {
  const { cache = 'standard', ...restOptions } = options ?? {}
  const cacheConfig = cacheProfiles[cache]

  return useQuery<TQueryFnData, TError, TData>({
    queryKey,
    queryFn,
    ...cacheConfig,
    ...restOptions,
  })
}
