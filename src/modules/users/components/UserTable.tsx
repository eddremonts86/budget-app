import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { UnifiedDataTable } from '@/shared/ui/tables/DataTable'
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
}: UserTableProps) {
  const { t } = useTranslation()
  const columns = useUserColumns(onEdit, onDelete)

  return (
    <>
      <UnifiedDataTable
        columns={columns}
        data={users}
        enableGrouping
        groupableColumns={['roleName', 'departmentName', 'jobTitleName']}
        enablePagination
        pageSizeOptions={[10, 20, 50]}
        initialPageSize={20}
        enableExport
        exportFileName="users.csv"
        enableSelection={false}
        fullHeight
      />
      <div className="h-10 flex items-center justify-center shrink-0">
        {hasNextPage && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onFetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage
              ? t('common.loading')
              : t('common.loadMore', { defaultValue: 'Load more' })}
          </Button>
        )}
      </div>
    </>
  )
}
