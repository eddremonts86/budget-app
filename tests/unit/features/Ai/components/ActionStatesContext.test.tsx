import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ActionStatesProvider } from '@/modules/ai/components/ActionStatesContext'
import { useActionStates } from '@/modules/ai/components/useActionStates'
import type { PersistedActionState } from '@/modules/ai/storage/chat-storage'

function TestConsumer() {
  const { states, saveState } = useActionStates()
  return (
    <div>
      <div data-testid="states">{JSON.stringify(states)}</div>
      <button onClick={() => saveState('action_1', { status: 'success', message: 'Done' })}>
        Save
      </button>
    </div>
  )
}

describe('ActionStatesContext', () => {
  afterEach(cleanup)

  it('should provide empty states by default', () => {
    render(
      <ActionStatesProvider states={{}} onSaveState={() => {}}>
        <TestConsumer />
      </ActionStatesProvider>,
    )
    expect(screen.getByTestId('states').textContent).toBe('{}')
  })

  it('should provide the states passed to the provider', () => {
    const states: Record<string, PersistedActionState> = {
      hash_1: { status: 'success', message: 'Task created' },
      hash_2: { status: 'error', message: 'Failed' },
    }
    render(
      <ActionStatesProvider states={states} onSaveState={() => {}}>
        <TestConsumer />
      </ActionStatesProvider>,
    )
    expect(JSON.parse(screen.getByTestId('states').textContent!)).toEqual(states)
  })

  it('should call onSaveState when saveState is invoked', () => {
    const onSaveState = vi.fn()
    render(
      <ActionStatesProvider states={{}} onSaveState={onSaveState}>
        <TestConsumer />
      </ActionStatesProvider>,
    )
    act(() => {
      screen.getByText('Save').click()
    })
    expect(onSaveState).toHaveBeenCalledWith('action_1', {
      status: 'success',
      message: 'Done',
    })
  })

  it('should update when states prop changes', () => {
    const { rerender } = render(
      <ActionStatesProvider states={{}} onSaveState={() => {}}>
        <TestConsumer />
      </ActionStatesProvider>,
    )
    expect(screen.getByTestId('states').textContent).toBe('{}')

    const newStates: Record<string, PersistedActionState> = {
      hash_3: { status: 'denied', message: 'Permission denied' },
    }
    rerender(
      <ActionStatesProvider states={newStates} onSaveState={() => {}}>
        <TestConsumer />
      </ActionStatesProvider>,
    )
    expect(JSON.parse(screen.getByTestId('states').textContent!)).toEqual(newStates)
  })

  it('should provide default values when used outside provider', () => {
    // useActionStates has a default context with empty states and no-op saveState
    render(<TestConsumer />)
    expect(screen.getByTestId('states').textContent).toBe('{}')
    // Should not throw when calling saveState outside provider
    act(() => {
      screen.getByText('Save').click()
    })
  })
})
