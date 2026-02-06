import {
  type InfiniteData,
  type QueryFunction,
  type QueryKey,
  useInfiniteQuery,
} from '@tanstack/react-query'
import { cacheProfiles } from './query-config'
import type { TQInfiniteOptions } from './types'

/**
 * Wrapper around useInfiniteQuery with unified cache configuration
 * For paginated/infinite scroll lists.
 *
 * @example
 * ```tsx
 * const { data, fetchNextPage, hasNextPage } = useTQInfinite(
 *   ['todos', 'infinite'],
 *   ({ pageParam = 1 }) => todoApi.getPage(pageParam),
 *   {
 *     cache: 'standard',
 *     getNextPageParam: (lastPage) => lastPage.nextCursor,
 *     initialPageParam: 1,
 *   }
 * )
 * ```
 */
export function useTQInfinite<
  TQueryFnData = unknown,
  TError = Error,
  TData = InfiniteData<TQueryFnData>,
  TPageParam = number,
>(
  queryKey: QueryKey,
  queryFn: QueryFunction<TQueryFnData, QueryKey, TPageParam>,
  options: TQInfiniteOptions<TQueryFnData, TError, TData, TPageParam> & {
    getNextPageParam: (lastPage: TQueryFnData, allPages: TQueryFnData[]) => TPageParam | undefined
    initialPageParam: TPageParam
  },
) {
  const { cache = 'standard', ...restOptions } = options
  const cacheConfig = cacheProfiles[cache]

  return useInfiniteQuery<TQueryFnData, TError, TData, QueryKey, TPageParam>({
    queryKey,
    queryFn,
    ...cacheConfig,
    ...restOptions,
  })
}
