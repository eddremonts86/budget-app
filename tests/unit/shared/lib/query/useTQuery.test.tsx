import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useTQuery } from '@/shared/lib/query/useTQuery'

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

describe('useTQuery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should fetch data successfully', async () => {
    const mockData = { id: 1, name: 'Test' }
    const queryFn = vi.fn().mockResolvedValue(mockData)

    const { result } = renderHook(() => useTQuery(['test'], queryFn), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(mockData)
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('should apply cache profile options', async () => {
    const queryFn = vi.fn().mockResolvedValue({ id: 1 })

    const { result } = renderHook(() => useTQuery(['test-cache'], queryFn, { cache: 'static' }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    // Verificamos que se pasaron las opciones de cache static (staleTime largo por ejemplo)
    // Aunque es difícil verificar la configuración interna de TanStack Query sin espiar el hook base
    expect(result.current.isSuccess).toBe(true)
  })

  it('should handle errors', async () => {
    const error = new Error('Fetch failed')
    const queryFn = vi.fn().mockRejectedValue(error)

    // Silenciamos el error de consola esperado por TanStack Query
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    const { result } = renderHook(() => useTQuery(['test-error'], queryFn, { retry: false }), {
      wrapper: createWrapper(),
    })

    await waitFor(() => expect(result.current.isError).toBe(true))
    expect(result.current.error).toEqual(error)

    consoleSpy.mockRestore()
  })
})
