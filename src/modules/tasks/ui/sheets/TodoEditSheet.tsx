import { useTranslation } from 'react-i18next'
import { CrudSheetBody, CrudSheetContent, CrudSheetHeader } from '@/components/ui/crud-sheet'
import { Sheet } from '@/components/ui/sheet'
import { useUpdateTodo } from '../../api/todos.queries'
import type { Todo } from '../../model/types'
import { TodoForm } from '../TodoForm'

interface TodoEditSheetProps {
  todo: Todo | null
  onClose: () => void
  currentUserId: string
}

export function TodoEditSheet({ todo, onClose, currentUserId }: TodoEditSheetProps) {
  const { t } = useTranslation()
  const updateMutation = useUpdateTodo()

  return (
    <Sheet
      open={!!todo}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <CrudSheetContent>
        <CrudSheetHeader
          title={t('todos.sheet.editTitle', 'Edit Task')}
          description={t('todos.sheet.editDescription', 'Update task details.')}
          onClose={onClose}
        />
        <CrudSheetBody>
          {todo && (
            <TodoForm
              defaultValues={todo}
              currentUserId={currentUserId}
              onSubmit={async (values) => {
                await updateMutation.mutateAsync({ id: todo.id, data: values })
                onClose()
              }}
              onCancel={onClose}
              isLoading={updateMutation.isPending}
            />
          )}
        </CrudSheetBody>
      </CrudSheetContent>
    </Sheet>
  )
}
