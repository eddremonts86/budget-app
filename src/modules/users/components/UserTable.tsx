import { VirtualTable } from '@/shared/ui/tables'
import type { User } from '../model/types'
import { useUserColumns } from '../hooks/useUserColumns'

interface UserTableProps {
  users: User[]
  onEdit: (user: User) => void
  onDelete: (user: User) => void
  hasNextPage: boolean
  isFetchingNextPage: boolean
  onFetchNextPage: () => void
  scrollResetKey?: string
}

export function UserTable({
  users,
  onEdit,
  onDelete,
  hasNextPage,
  isFetchingNextPage,
  onFetchNextPage,
  scrollResetKey,
}: UserTableProps) {
  const columns = useUserColumns(onEdit, onDelete)

  return (
    <VirtualTable
      columns={columns}
      data={users}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      onFetchNextPage={onFetchNextPage}
      scrollResetKey={scrollResetKey}
      rowHeight={64}
      cellClassName="py-4 px-6 text-sm border-b border-border/40 align-middle"
    />
  )
}
