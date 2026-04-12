import { queryOptions } from '@tanstack/react-query'
import { useTQuery, useTQInfinite } from '@/shared/lib/query'
import {
  getAnalyticsKPIsFn,
  getRevenueTrendFn,
  getTaskCompletionTrendFn,
  getProjectPerformanceFn,
  getProjectPerformancePaginatedFn,
  getTaskDistributionFn,
  getExpenseDistributionFn,
  getUsersWorkloadFn,
  type UsersWorkloadFilters,
} from './analytics.fn'

export const analyticsKeys = {
  all: ['analytics'] as const,
  kpis: () => [...analyticsKeys.all, 'kpis'] as const,
  revenueTrend: (days: number) => [...analyticsKeys.all, 'revenue-trend', days] as const,
  taskCompletionTrend: (days: number) =>
    [...analyticsKeys.all, 'task-completion-trend', days] as const,
  projectPerformance: () => [...analyticsKeys.all, 'project-performance'] as const,
  projectPerformanceInfinite: (params: { limit: number; search?: string }) =>
    [...analyticsKeys.all, 'project-performance-infinite', params] as const,
  taskDistribution: () => [...analyticsKeys.all, 'task-distribution'] as const,
}

export const kpisQueryOptions = queryOptions({
  queryKey: analyticsKeys.kpis(),
  queryFn: () => getAnalyticsKPIsFn({ data: undefined }),
})

export const revenueTrendQueryOptions = (days: number) =>
  queryOptions({
    queryKey: analyticsKeys.revenueTrend(days),
    queryFn: () => getRevenueTrendFn({ data: { days } }),
  })

export const taskCompletionTrendQueryOptions = (days: number) =>
  queryOptions({
    queryKey: analyticsKeys.taskCompletionTrend(days),
    queryFn: () => getTaskCompletionTrendFn({ data: { days } }),
  })

export const projectPerformanceQueryOptions = queryOptions({
  queryKey: analyticsKeys.projectPerformance(),
  queryFn: () => getProjectPerformanceFn({ data: undefined }),
})

export const taskDistributionQueryOptions = queryOptions({
  queryKey: analyticsKeys.taskDistribution(),
  queryFn: () => getTaskDistributionFn({ data: undefined }),
})

export const useInfiniteProjectPerformance = (limit = 20, search?: string) => {
  const params = { limit, search: search?.trim() || undefined }

  return useTQInfinite(
    analyticsKeys.projectPerformanceInfinite(params),
    ({ pageParam }) => getProjectPerformancePaginatedFn({ data: { pageParam, ...params } }),
    {
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
      maxPages: 10,
    },
  )
}

const ANALYTICS_CHART_REFRESH_INTERVAL = 90 * 1000

export const useExpenseDistribution = () => {
  return useTQuery(
    [...analyticsKeys.all, 'expenseDistribution'] as const,
    () => getExpenseDistributionFn({ data: undefined }),
    {
      cache: 'realtime',
      refetchInterval: ANALYTICS_CHART_REFRESH_INTERVAL,
      refetchOnWindowFocus: true,
    },
  )
}

export const useUsersWorkload = (filters?: UsersWorkloadFilters) => {
  return useTQuery(
    [...analyticsKeys.all, 'usersWorkload', filters ?? {}] as const,
    () => getUsersWorkloadFn({ data: filters }),
    {
      cache: 'realtime',
      refetchInterval: ANALYTICS_CHART_REFRESH_INTERVAL,
      refetchOnWindowFocus: true,
    },
  )
}
