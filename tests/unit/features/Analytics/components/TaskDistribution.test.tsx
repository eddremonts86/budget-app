import { useQuery } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, type Mock } from 'vitest'
import { TaskDistribution } from '@/modules/analytics/components/TaskDistribution'

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

describe('TaskDistribution', () => {
  it('renders loading state', () => {
    ;(useQuery as Mock).mockReturnValue({
      isLoading: true,
      data: undefined,
    })
    const { container } = render(<TaskDistribution />)
    // Skeletons are rendered directly in a grid
    expect(container.getElementsByClassName('animate-pulse').length).toBeGreaterThan(0)
  })

  it('renders error state', () => {
    ;(useQuery as Mock).mockReturnValue({
      isLoading: false,
      error: new Error('Failed to fetch'),
    })
    render(<TaskDistribution />)
    expect(screen.getAllByText('Error loading task data')).toHaveLength(2)
  })

  it('renders charts with data', () => {
    ;(useQuery as Mock).mockReturnValue({
      isLoading: false,
      data: {
        byStatus: [{ name: 'Pending', value: 10 }],
        byPriority: [{ name: 'High', value: 5 }],
      },
    })
    render(<TaskDistribution />)
    expect(screen.getByText('Tasks by Status')).toBeDefined()
    expect(screen.getByText('Tasks by Priority')).toBeDefined()
    expect(screen.queryByText('Error loading task data')).toBeNull()
  })
})
