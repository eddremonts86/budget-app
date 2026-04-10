import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useInfiniteProjects, useProjectMembers } from '@/modules/projects'
import { TodoForm } from '@/modules/tasks/ui/TodoForm'
import { useInfiniteUsers } from '@/modules/users'

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}))

vi.mock('@/modules/projects', () => ({
  useInfiniteProjects: vi.fn(),
  useProjectMembers: vi.fn(),
}))

vi.mock('@/modules/users', () => ({
  useInfiniteUsers: vi.fn(),
}))

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.ComponentProps<'div'>) => <div {...props}>{children}</div>,
    form: ({ children, ...props }: React.ComponentProps<'form'>) => (
      <form {...props}>{children}</form>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

describe('TodoForm', () => {
  const mockProjects = [
    { id: '1', name: 'Active Project', status: 'active' },
    { id: '2', name: 'Inactive Project', status: 'completed' },
  ]

  const mockUsers = [{ id: 'u1', name: 'User 1', avatar: '' }]

  beforeEach(() => {
    ;(useInfiniteProjects as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { pages: [{ data: mockProjects }] },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    })
    ;(useInfiniteUsers as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { pages: [{ data: mockUsers }] },
      fetchNextPage: vi.fn(),
      hasNextPage: false,
      isFetchingNextPage: false,
    })
    ;(useProjectMembers as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: [{ projectId: '1', userId: 'u1', role: 'owner' }],
      isLoading: false,
    })
  })

  it('should render project selector', () => {
    render(<TodoForm onSubmit={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('todos.form.projectLabel')).toBeDefined()
  })

  it('should require project selection', async () => {
    const onSubmit = vi.fn()
    render(<TodoForm onSubmit={onSubmit} onCancel={vi.fn()} />)

    // Using fireEvent.submit on the form directly or clicking the button
    // Finding the submit button by text (using translation key)
    const submitBtn = screen.getByText('todos.actions.create')
    fireEvent.click(submitBtn)

    await waitFor(() => {
      // Expect validation error (zod schema requires min(1))
      // The error message key is 'validation.required'
      expect(screen.getAllByText('validation.required').length).toBeGreaterThan(0)
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })
})
