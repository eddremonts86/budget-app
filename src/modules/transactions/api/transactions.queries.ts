import { i18n } from '@/shared/lib/i18n'
import { useTQuery, useTQInfinite, useTQMutation } from '@/shared/lib/query'
import type { Transaction } from '../model/types'
import {
  type TransactionInput,
  createTransactionFn,
  deleteTransactionFn,
  getTransactionByIdFn,
  getTransactionsFn,
  updateTransactionFn,
} from './transactions.fn'

export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  infinite: () => [...transactionKeys.lists(), 'infinite'] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
}

export const useInfiniteTransactions = (limit = 10) => {
  return useTQInfinite(
    [...transactionKeys.infinite(), { limit }],
    ({ pageParam }) => getTransactionsFn({ data: { pageParam, limit } }),
    {
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
    },
  )
}

export const useTransactions = (options?: { enabled?: boolean }) => {
  return useTQuery<Transaction[]>(
    transactionKeys.lists(),
    () => getTransactionsFn({ data: { limit: 50 } }).then((res) => res.data),
    options,
  )
}

export const useTransaction = (id: string) => {
  return useTQuery(transactionKeys.detail(id), () => getTransactionByIdFn({ data: id }))
}

export const useCreateTransaction = () => {
  return useTQMutation(
    ['transactions', 'create'],
    (data: TransactionInput) => createTransactionFn({ data }),
    {
      invalidateKeys: [transactionKeys.all],
      successMessage: i18n.t('transactions.toast.created'),
    },
  )
}

export const useUpdateTransaction = () => {
  return useTQMutation(
    ['transactions', 'update'],
    ({ id, data }: { id: string; data: Partial<TransactionInput> }) =>
      updateTransactionFn({ data: { id, data } }),
    {
      invalidateKeys: [transactionKeys.all],
      successMessage: i18n.t('transactions.toast.updated'),
    },
  )
}

export const useDeleteTransaction = () => {
  return useTQMutation(
    ['transactions', 'delete'],
    (id: string) => deleteTransactionFn({ data: id }),
    {
      invalidateKeys: [transactionKeys.all],
      successMessage: i18n.t('transactions.toast.deleted'),
    },
  )
}
