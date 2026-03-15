import { useQuery } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, type Mock } from 'vitest'
import { RevenueChart } from '@/modules/analytics/components/RevenueChart'

// Mock useQuery
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: vi.fn(),
  }
})

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue ?? key,
  }),
}))

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
    expect(screen.getByText('Financial Trend')).toBeDefined()
  })

  it('renders error state', () => {
    ;(useQuery as Mock).mockReturnValue({
      isLoading: false,
      error: new Error('Failed to fetch'),
    })
    render(<RevenueChart days={30} />)
    expect(screen.getByText('Error loading financial data')).toBeDefined()
  })

  it('renders chart with data', () => {
    ;(useQuery as Mock).mockReturnValue({
      isLoading: false,
      data: [
        { date: '2023-01-01', income: 100, expenses: 30 },
        { date: '2023-01-02', income: 200, expenses: 90 },
      ],
    })
    render(<RevenueChart days={30} />)
    expect(screen.getByText('Financial Trend')).toBeDefined()
    // Recharts is hard to query by text, but we can check if the chart container is there
    // Or we can just ensure no error/loading state is shown
    expect(screen.queryByText('Error loading financial data')).toBeNull()
  })
})
