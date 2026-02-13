import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { ErrorStateView } from '@/shared/ui/feedback/ErrorStateView'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div className={className}>{children}</div>
    ),
    h1: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <h1 className={className}>{children}</h1>
    ),
    p: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <p className={className}>{children}</p>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  AlertCircle: () => <div data-testid="alert-icon" />,
  ChevronDown: ({ className }: { className?: string }) => (
    <div data-testid="chevron-icon" className={className} />
  ),
  Home: () => <div data-testid="home-icon" />,
  RefreshCcw: () => <div data-testid="refresh-icon" />,
  Lock: () => <div data-testid="lock-icon" />,
}))

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback || key,
  }),
}))

// Mock UI components
vi.mock('@/components/ui', () => ({
  Button: ({
    children,
    onClick,
    className,
  }: {
    children: React.ReactNode
    onClick?: () => void
    className?: string
  }) => (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  ),
}))

describe('ErrorStateView', () => {
  const defaultProps = {
    title: 'Error Title',
    description: 'Error Description',
    isAuthenticated: true,
  }

  it('renders authenticated state correctly', () => {
    render(<ErrorStateView {...defaultProps} />)
    expect(screen.getByText('Error Title')).toBeTruthy()
    expect(screen.getByText('Error Description')).toBeTruthy()
    expect(screen.getByTestId('alert-icon')).toBeTruthy()
  })

  it('renders unauthenticated state correctly', () => {
    render(<ErrorStateView {...defaultProps} isAuthenticated={false} />)
    // Should show boundary.unauthenticatedTitle instead of the title prop
    expect(screen.getByText('Acceso restringido')).toBeTruthy()
    expect(screen.getByTestId('lock-icon')).toBeTruthy()
  })

  it('shows technical details button only when authenticated and error exists', () => {
    const { rerender } = render(<ErrorStateView {...defaultProps} errorDetails="Technical error" />)
    expect(screen.getByText('boundary.showDetails')).toBeTruthy()

    rerender(
      <ErrorStateView {...defaultProps} isAuthenticated={false} errorDetails="Technical error" />,
    )
    expect(screen.queryByText('boundary.showDetails')).toBeNull()

    rerender(<ErrorStateView {...defaultProps} isAuthenticated={true} errorDetails={null} />)
    expect(screen.queryByText('boundary.showDetails')).toBeNull()
  })

  it('toggles technical details when button is clicked', () => {
    render(<ErrorStateView {...defaultProps} errorDetails="Technical error" />)
    const button = screen.getByText('boundary.showDetails')
    fireEvent.click(button)
    expect(screen.getByText('Technical error')).toBeTruthy()
    expect(screen.getByText('boundary.hideDetails')).toBeTruthy()
  })

  it('renders custom icon if provided', () => {
    render(<ErrorStateView {...defaultProps} icon={<div data-testid="custom-icon" />} />)
    expect(screen.getByTestId('custom-icon')).toBeTruthy()
    expect(screen.queryByTestId('alert-icon')).toBeNull()
  })

  it('renders user role when provided and authenticated', () => {
    render(<ErrorStateView {...defaultProps} userRole="admin" />)
    expect(screen.getByText('Role: admin')).toBeTruthy()
  })

  it('does not render user role when unauthenticated', () => {
    render(<ErrorStateView {...defaultProps} userRole="admin" isAuthenticated={false} />)
    expect(screen.queryByText('Role: admin')).toBeNull()
  })
})
