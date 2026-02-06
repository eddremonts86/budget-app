import { type QueryFunction, type QueryKey, useSuspenseQuery } from '@tanstack/react-query'
import { cacheProfiles } from './query-config'
import type { TQSuspenseOptions } from './types'

/**
 * Wrapper around useSuspenseQuery with unified cache configuration
 * Use with React Suspense boundaries.
 *
 * @example
 * ```tsx
 * // Component must be wrapped in <Suspense fallback={...}>
 * function TodoDetail({ id }: { id: string }) {
 *   const { data } = useTQSuspense(
 *     ['todos', id],
 *     () => todoApi.getById(id),
 *     { cache: 'stable' }
 *   )
 *   return <div>{data.title}</div>
 * }
 * ```
 */
export function useTQSuspense<TQueryFnData = unknown, TError = Error, TData = TQueryFnData>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TQueryFnData>,
  options?: TQSuspenseOptions<TQueryFnData, TError, TData>,
) {
  const { cache = 'standard', ...restOptions } = options ?? {}
  const cacheConfig = cacheProfiles[cache]

  return useSuspenseQuery<TQueryFnData, TError, TData>({
    queryKey,
    queryFn,
    ...cacheConfig,
    ...restOptions,
  })
}
