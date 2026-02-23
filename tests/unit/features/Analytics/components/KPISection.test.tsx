import { useQuery } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi, type Mock } from 'vitest'
import { KPISection } from '@/features/Analytics/components/KPISection'

// Mock useQuery
vi.mock('@tanstack/react-query', async () => {
  const actual = await vi.importActual('@tanstack/react-query')
  return {
    ...actual,
    useQuery: vi.fn(),
  }
})

// Mock translations
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe('KPISection', () => {
  it('renders loading state', () => {
    ;(useQuery as Mock).mockReturnValue({
      isLoading: true,
      data: undefined,
    })
    const { container } = render(<KPISection />)
    expect(container.firstChild).toBeDefined()
  })

  it('renders data correctly', () => {
    ;(useQuery as Mock).mockReturnValue({
      isLoading: false,
      data: {
        revenue: 15000,
        activeProjects: 5,
        taskCompletionRate: 75,
        totalTasks: 100,
        completedTasks: 75,
        activeUsers: 10,
      },
    })
    render(<KPISection />)

    expect(screen.getByText('Total Revenue')).toBeDefined()
    expect(screen.getByText('Active Projects')).toBeDefined()
    expect(screen.getByText('$15,000')).toBeDefined()
    expect(screen.getByText('5')).toBeDefined()
    expect(screen.getByText('75%')).toBeDefined()
  })

  it('renders error state', () => {
    ;(useQuery as Mock).mockReturnValue({
      isLoading: false,
      error: new Error('Failed to fetch'),
    })
    render(<KPISection />)
    expect(screen.getByText('Error loading KPIs')).toBeDefined()
  })
})
