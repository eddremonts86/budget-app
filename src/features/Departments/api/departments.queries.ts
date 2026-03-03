import { useTQuery } from '@/shared/lib/query'
import { getDepartmentsFn } from './departments.fn'

export const departmentKeys = {
  all: ['departments'] as const,
  lists: () => [...departmentKeys.all, 'list'] as const,
}

export const useDepartments = () => {
  return useTQuery(departmentKeys.lists(), () => getDepartmentsFn())
}
