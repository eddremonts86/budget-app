import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { UnifiedDataTable } from '@/shared/ui/tables/DataTable'

type IntegrationItem = {
  id: string
  customer: string
  status: string
  owner: string
}

const columns = [
  {
    accessorKey: 'customer',
    header: 'Customer',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'owner',
    header: 'Owner',
  },
]

const data: IntegrationItem[] = [
  { id: '1', customer: 'Acme Corp', status: 'Pending', owner: 'Alice' },
  { id: '2', customer: 'Globex', status: 'Approved', owner: 'Bob' },
  { id: '3', customer: 'Initech', status: 'Pending', owner: 'Alice' },
]

beforeEach(() => {
  Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true })
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
})

describe('UnifiedDataTable integration', () => {
  it('combines filtering, selection, bulk action and export flow', async () => {
    const onBulkAction = vi.fn()
    const onExport = vi.fn()

    render(
      <UnifiedDataTable
        columns={columns}
        data={data}
        filterColumn="customer"
        filters={[
          {
            columnId: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { label: 'Pending', value: 'Pending' },
              { label: 'Approved', value: 'Approved' },
            ],
          },
          { columnId: 'owner', label: 'Owner', type: 'text' },
        ]}
        bulkActions={[{ label: 'Process selected', onClick: onBulkAction }]}
        onExport={onExport}
        groupableColumns={['status']}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /filtros avanzados/i }))
    fireEvent.change(screen.getByPlaceholderText('Filtrar por Owner'), {
      target: { value: 'Alice' },
    })

    await waitFor(() => {
      expect(screen.getAllByText('Alice').length).toBeGreaterThan(0)
      expect(screen.queryAllByText('Bob')).toHaveLength(0)
    })

    fireEvent.click(screen.getAllByLabelText('Seleccionar fila')[0])
    fireEvent.click(screen.getByRole('button', { name: /process selected/i }))
    fireEvent.click(screen.getByRole('button', { name: /exportar/i }))

    expect(onBulkAction).toHaveBeenCalledTimes(1)
    expect(onBulkAction.mock.calls[0][0]).toHaveLength(1)
    expect(onExport).toHaveBeenCalledTimes(1)
    expect(onExport.mock.calls[0][0]).toHaveLength(1)
  })
})
