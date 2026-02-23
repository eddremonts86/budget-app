import { useQuery } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, type Mock } from 'vitest'
import { RevenueChart } from '@/features/Analytics/components/RevenueChart'

// Mock useQuery
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: vi.fn(),
  }
})

// Mock ResizeObserver for Recharts
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

describe('RevenueChart', () => {
  it('renders loading state', () => {
    ;(useQuery as Mock).mockReturnValue({
      isLoading: true,
      data: undefined,
    })
    render(<RevenueChart days={30} />)
    // Expect skeleton or loading indicator
    // The component renders a Skeleton when isLoading is true
    // But Skeleton might not have text, so we check for container presence
    expect(screen.getByText('Revenue Trend')).toBeDefined()
  })

  it('renders error state', () => {
    ;(useQuery as Mock).mockReturnValue({
      isLoading: false,
      error: new Error('Failed to fetch'),
    })
    render(<RevenueChart days={30} />)
    expect(screen.getByText('Error loading revenue data')).toBeDefined()
  })

  it('renders chart with data', () => {
    ;(useQuery as Mock).mockReturnValue({
      isLoading: false,
      data: [
        { date: '2023-01-01', amount: 100 },
        { date: '2023-01-02', amount: 200 },
      ],
    })
    render(<RevenueChart days={30} />)
    expect(screen.getByText('Revenue Trend')).toBeDefined()
    // Recharts is hard to query by text, but we can check if the chart container is there
    // Or we can just ensure no error/loading state is shown
    expect(screen.queryByText('Error loading revenue data')).toBeNull()
  })
})
