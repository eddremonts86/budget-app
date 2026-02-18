import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useProjects } from '@/features/Projects/api/projects.queries'
import { TodoForm } from '@/features/Todos/components/TodoForm'
import { useUsers } from '@/features/Users/api/users.queries'

// Mock dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}))

vi.mock('@/features/Projects/api/projects.queries', () => ({
  useProjects: vi.fn(),
}))

vi.mock('@/features/Users/api/users.queries', () => ({
  useUsers: vi.fn(),
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
    ;(useProjects as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ data: mockProjects })
    ;(useUsers as unknown as ReturnType<typeof vi.fn>).mockReturnValue({ data: mockUsers })
  })

  it('should render project selector', () => {
    render(<TodoForm onSubmit={vi.fn()} onCancel={vi.fn()} />)
    expect(screen.getByText('todos.form.projectPlaceholder')).toBeDefined()
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
