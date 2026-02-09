import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { TodoForm } from './TodoForm'

const mutateAsyncMock = vi.hoisted(() => vi.fn(() => Promise.resolve()))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('@/features/ToDo/api', () => ({
  useCreateTodo: () => ({
    mutateAsync: mutateAsyncMock,
  }),
}))

vi.mock('@/components/ui', () => ({
  Button: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => <button {...props} />,
  Input: (props: React.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
  Textarea: (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea {...props} />,
  Label: (props: React.LabelHTMLAttributes<HTMLLabelElement>) => <label {...props} />,
  Select: (props: React.HTMLAttributes<HTMLDivElement>) => <div {...props} />,
  SelectContent: (props: React.HTMLAttributes<HTMLDivElement>) => <div {...props} />,
  SelectItem: (props: React.HTMLAttributes<HTMLDivElement>) => <div {...props} />,
  SelectTrigger: (props: React.HTMLAttributes<HTMLDivElement>) => <div {...props} />,
  SelectValue: (props: React.HTMLAttributes<HTMLDivElement>) => <div {...props} />,
  DatePicker: (props: { value?: string; onChange?: (value: string) => void }) => (
    <input
      type="date"
      value={props.value ?? ''}
      onChange={(e) => props.onChange?.(e.target.value)}
    />
  ),
}))

describe('TodoForm', () => {
  beforeEach(() => {
    mutateAsyncMock.mockClear()
  })

  it('submits valid form data', async () => {
    const onSuccess = vi.fn()
    render(<TodoForm onSuccess={onSuccess} />)

    fireEvent.change(screen.getByLabelText(/todo\.fields\.title/), {
      target: { value: 'Nueva tarea' },
    })

    fireEvent.change(screen.getByLabelText(/todo\.fields\.description/), {
      target: { value: 'Detalle' },
    })

    fireEvent.submit(screen.getByRole('button'))

    await waitFor(() => {
      expect(mutateAsyncMock).toHaveBeenCalledTimes(1)
    })
    expect(onSuccess).toHaveBeenCalledTimes(1)
  })
})
