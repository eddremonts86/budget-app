import { queryOptions } from '@tanstack/react-query'
import { getAnalyticsKPIsFn, getRevenueTrendFn, getTaskCompletionTrendFn, getProjectPerformanceFn, getTaskDistributionFn } from './analytics.fn'

export const analyticsKeys = {
  all: ['analytics'] as const,
  kpis: () => [...analyticsKeys.all, 'kpis'] as const,
  revenueTrend: (days: number) => [...analyticsKeys.all, 'revenue-trend', days] as const,
  taskCompletionTrend: (days: number) => [...analyticsKeys.all, 'task-completion-trend', days] as const,
  projectPerformance: () => [...analyticsKeys.all, 'project-performance'] as const,
  taskDistribution: () => [...analyticsKeys.all, 'task-distribution'] as const,
}

export const kpisQueryOptions = queryOptions({
  queryKey: analyticsKeys.kpis(),
  queryFn: () => getAnalyticsKPIsFn({ data: undefined }),
})

export const revenueTrendQueryOptions = (days: number) => queryOptions({
  queryKey: analyticsKeys.revenueTrend(days),
  queryFn: () => getRevenueTrendFn({ data: { days } }),
})

export const taskCompletionTrendQueryOptions = (days: number) => queryOptions({
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
