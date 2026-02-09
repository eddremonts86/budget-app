import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTQuery, useTQInfinite } from '@/shared/lib/query'
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
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: transactionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
    },
  })
}

export const useUpdateTransaction = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: Parameters<typeof transactionsApi.update>[1]
    }) => transactionsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
      queryClient.invalidateQueries({ queryKey: transactionKeys.detail(id) })
    },
  })
}

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: transactionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.all })
    },
  })
}
