import { i18n } from '@/shared/lib/i18n'
import { useTQuery, useTQInfinite, useTQMutation } from '@/shared/lib/query'
import { transactionsApi } from './transactions.api'

export const transactionKeys = {
  all: ['transactions'] as const,
  lists: () => [...transactionKeys.all, 'list'] as const,
  infinite: () => [...transactionKeys.lists(), 'infinite'] as const,
  details: () => [...transactionKeys.all, 'detail'] as const,
  detail: (id: string) => [...transactionKeys.details(), id] as const,
}

export const useInfiniteTransactions = (limit = 10) => {
  return useTQInfinite(
    transactionKeys.infinite(),
    ({ pageParam }) => transactionsApi.getAll({ pageParam, limit }),
    {
      initialPageParam: 1,
      getNextPageParam: (lastPage) => lastPage.nextPage,
    },
  )
}

export const useTransactions = () => {
  return useTQuery(transactionKeys.lists(), () =>
    transactionsApi.getAll({ limit: 1000 }).then((res) => res.data),
  )
}

export const useTransaction = (id: string) => {
  return useTQuery(transactionKeys.detail(id), () => transactionsApi.getById(id))
}

export const useCreateTransaction = () => {
  return useTQMutation(['transactions', 'create'], transactionsApi.create, {
    invalidateKeys: [transactionKeys.all],
    successMessage: i18n.t('transactions.toast.created'),
  })
}

export const useUpdateTransaction = () => {
  return useTQMutation(['transactions', 'update'], ({
    id,
    data,
  }: {
    id: string
    data: Parameters<typeof transactionsApi.update>[1]
  }) => transactionsApi.update(id, data), {
    invalidateKeys: [transactionKeys.all],
    successMessage: i18n.t('transactions.toast.updated'),
  })
}

export const useDeleteTransaction = () => {
  return useTQMutation(['transactions', 'delete'], transactionsApi.delete, {
    invalidateKeys: [transactionKeys.all],
    successMessage: i18n.t('transactions.toast.deleted'),
  })
}
