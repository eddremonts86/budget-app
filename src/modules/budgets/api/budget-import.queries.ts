import { useTQuery, useTQMutation } from '@/shared/lib/query'
import {
  uploadAndAnalyzeImportFn,
  listMyImportsFn,
  getImportByIdFn,
  linkImportToBudgetFn,
  applyImportTransactionsFn,
  type BudgetImport,
} from './budget-import.fn'

export const importKeys = {
  all: ['budget-imports'] as const,
  list: () => [...importKeys.all, 'list'] as const,
  detail: (id: string) => [...importKeys.all, 'detail', id] as const,
}

export function useMyImports() {
  return useTQuery(importKeys.list(), () => listMyImportsFn(), { cache: 'realtime' })
}

export function useImport(id: string) {
  return useTQuery(importKeys.detail(id), () => getImportByIdFn({ data: id }), {
    cache: 'realtime',
    enabled: !!id,
  })
}

export function useUploadAndAnalyzeImport() {
  return useTQMutation(
    ['budget-imports', 'upload'],
    (data: {
      fileName: string
      fileType: 'csv' | 'xlsx' | 'pdf'
      fileSize: number
      fileContent: string
    }) => uploadAndAnalyzeImportFn({ data }),
    {
      invalidateKeys: [importKeys.list()],
    },
  )
}

export function useLinkImportToBudget() {
  return useTQMutation(
    ['budget-imports', 'link'],
    (data: { importId: string; budgetId: string }) => linkImportToBudgetFn({ data }),
    {
      invalidateKeys: [importKeys.list()],
    },
  )
}

export function useApplyImportTransactions() {
  return useTQMutation(
    ['budget-imports', 'apply'],
    (data: {
      importId: string
      budgetId: string
      overrides?: Array<{
        description: string
        action: 'make_recurring' | 'make_direct'
        frequency?: string
      }>
    }) => applyImportTransactionsFn({ data }),
    {
      invalidateKeys: [importKeys.list()],
    },
  )
}

export type { BudgetImport }
