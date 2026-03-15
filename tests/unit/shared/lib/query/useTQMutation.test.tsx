import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTQMutation } from '@/shared/lib/query/useTQMutation'
import { toast } from '@/shared/lib/toast'

vi.mock('@/shared/lib/toast', () => ({
  toast: {
    success: vi.fn(),
  },
}))

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useTQMutation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show success toast when mutation succeeds', async () => {
    const mutationFn = vi.fn().mockResolvedValue({ id: 1 })
    const { result } = renderHook(
      () =>
        useTQMutation(['test'], mutationFn, {
          successMessage: 'Success!',
        }),
      { wrapper: createWrapper() },
    )

    result.current.mutate({ name: 'test' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Success!')
  })

  it('should invalidate queries when configured', async () => {
    const queryClient = new QueryClient()
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries')

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )

    const mutationFn = vi.fn().mockResolvedValue({ id: 1 })
    const { result } = renderHook(
      () =>
        useTQMutation(['test'], mutationFn, {
          invalidateKeys: [['todos']],
        }),
      { wrapper },
    )

    result.current.mutate({ name: 'test' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        queryKey: ['todos'],
      }),
    )
  })

  it('should handle function-based success messages', async () => {
    const mutationFn = vi.fn().mockResolvedValue({ name: 'Test Item' })
    const { result } = renderHook(
      () =>
        useTQMutation(['test'], mutationFn, {
          successMessage: (data: { name: string }) => `Item ${data.name} created`,
        }),
      { wrapper: createWrapper() },
    )

    result.current.mutate({ name: 'test' })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(toast.success).toHaveBeenCalledWith('Item Test Item created')
  })
})
