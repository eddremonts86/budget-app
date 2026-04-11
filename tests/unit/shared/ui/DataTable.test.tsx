import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { UnifiedDataTable } from '@/shared/ui/tables/DataTable'

type TableItem = {
  id: string
  name: string
  status: string
  team: string
}

const columns = [
  {
    accessorKey: 'name',
    header: 'Name',
  },
  {
    accessorKey: 'status',
    header: 'Status',
  },
  {
    accessorKey: 'team',
    header: 'Team',
  },
]

const data: TableItem[] = [
  { id: '3', name: 'Charlie', status: 'Pending', team: 'Gamma' },
  { id: '1', name: 'Alpha', status: 'Approved', team: 'Alpha' },
  { id: '2', name: 'Bravo', status: 'Pending', team: 'Beta' },
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

describe('UnifiedDataTable', () => {
  it('ordena por columna y pagina resultados', async () => {
    render(
      <UnifiedDataTable
        columns={columns}
        data={data}
        initialPageSize={2}
        pageSizeOptions={[2]}
        filterColumn="name"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /name/i }))
    expect(screen.getAllByText('Alpha').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Bravo').length).toBeGreaterThan(0)

    expect(screen.getByText('1 / 2')).toBeTruthy()
    const pageButtons = screen.getAllByRole('button')
    const nextPageButton = pageButtons[pageButtons.length - 1]
    fireEvent.click(nextPageButton)
    await waitFor(() => {
      expect(screen.getAllByText('Charlie').length).toBeGreaterThan(0)
    })
  })

  it('aplica filtros avanzados simultáneos', async () => {
    render(
      <UnifiedDataTable
        columns={columns}
        data={data}
        filterColumn="name"
        filters={[
          { columnId: 'name', label: 'Name', type: 'text' },
          { columnId: 'team', label: 'Team', type: 'text' },
        ]}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /filtros avanzados/i }))

    const nameInput = screen.getByPlaceholderText('Filtrar por Name')
    const teamInput = screen.getByPlaceholderText('Filtrar por Team')

    fireEvent.change(nameInput, { target: { value: 'a' } })
    fireEvent.change(teamInput, { target: { value: 'alpha' } })

    await waitFor(() => {
      expect(screen.getAllByText('Alpha').length).toBeGreaterThan(0)
      expect(screen.queryAllByText('Bravo')).toHaveLength(0)
      expect(screen.queryAllByText('Charlie')).toHaveLength(0)
    })
  })

  it('ejecuta bulk actions y exporta filas seleccionadas', () => {
    const onBulk = vi.fn()
    const onExport = vi.fn()

    render(
      <UnifiedDataTable
        columns={columns}
        data={data}
        filterColumn="name"
        onExport={onExport}
        bulkActions={[
          {
            label: 'Aprobar seleccionados',
            onClick: onBulk,
          },
        ]}
      />,
    )

    fireEvent.click(screen.getAllByLabelText('Seleccionar fila')[0])
    fireEvent.click(screen.getByRole('button', { name: /aprobar seleccionados/i }))
    fireEvent.click(screen.getByRole('button', { name: /exportar/i }))

    expect(onBulk).toHaveBeenCalledTimes(1)
    expect(onBulk.mock.calls[0][0]).toHaveLength(1)
    expect(onExport).toHaveBeenCalledTimes(1)
    expect(onExport.mock.calls[0][0]).toHaveLength(1)
  })
})
