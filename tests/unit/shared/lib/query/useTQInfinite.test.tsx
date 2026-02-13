import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTQInfinite } from '@/shared/lib/query/useTQInfinite'

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

describe('useTQInfinite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch paginated data successfully', async () => {
    interface TestPage {
      data: number[]
      nextPage: number | undefined
    }
    const page1: TestPage = { data: [1, 2], nextPage: 2 }
    const page2: TestPage = { data: [3, 4], nextPage: undefined }

    const queryFn = vi.fn().mockResolvedValueOnce(page1).mockResolvedValueOnce(page2)

    const { result } = renderHook(
      () =>
        useTQInfinite(['infinite-test'], ({ pageParam }) => queryFn(pageParam), {
          initialPageParam: 1,
          getNextPageParam: (lastPage: TestPage) => lastPage.nextPage,
        }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data?.pages[0]).toEqual(page1)

    // Cargar siguiente página
    result.current.fetchNextPage()

    await waitFor(() => expect(result.current.data?.pages.length).toBe(2))
    expect(result.current.data?.pages[1]).toEqual(page2)
    expect(queryFn).toHaveBeenCalledWith(1)
    expect(queryFn).toHaveBeenCalledWith(2)
  })

  it('should handle end of pagination', async () => {
    interface TestPage {
      data: number[]
      nextPage: number | undefined
    }
    const page1: TestPage = { data: [1], nextPage: undefined }
    const queryFn = vi.fn().mockResolvedValue(page1)

    const { result } = renderHook(
      () =>
        useTQInfinite(['infinite-test-end'], ({ pageParam }) => queryFn(pageParam), {
          initialPageParam: 1,
          getNextPageParam: (lastPage: TestPage) => lastPage.nextPage,
        }),
      { wrapper: createWrapper() },
    )

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.hasNextPage).toBe(false)
  })
})
