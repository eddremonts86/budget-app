import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { DELETE_TOAST_DURATION } from '@/shared/ui/tables'
import { toast } from '@/shared/lib/toast'
import { useDeleteCategory } from '../api/categories.queries'
import type { Category } from '../model/types'

export function useCategoryActions(onEdit: (category: Category) => void) {
  const { t } = useTranslation()
  const deleteMutation = useDeleteCategory()

  const handleEdit = React.useCallback(
    (category: Category) => {
      onEdit(category)
    },
    [onEdit],
  )

  const handleDelete = React.useCallback(
    (category: Category) => {
      toast.error(t('categories.confirm.delete'), {
        description: t('common.undoWarning'),
        action: {
          label: t('common.delete'),
          onClick: () => deleteMutation.mutate(category.id),
        },
        duration: DELETE_TOAST_DURATION,
      })
    },
    [t, deleteMutation],
  )

  return { handleEdit, handleDelete }
}
