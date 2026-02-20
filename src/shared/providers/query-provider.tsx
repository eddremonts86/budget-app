import { QueryClientProvider } from '@tanstack/react-query'
import * as React from 'react'
import { queryClient } from '@/shared/lib/query'

interface QueryProviderProps {
  children: React.ReactNode
}

export function QueryProvider({ children }: QueryProviderProps) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
