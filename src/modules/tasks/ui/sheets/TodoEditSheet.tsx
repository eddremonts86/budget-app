import { useTranslation } from 'react-i18next'
import { CrudSheetHeader } from '@/components/ui/crud-sheet'
import { Sheet, SheetContent } from '@/components/ui/sheet'
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
      <SheetContent
        showCloseButton={false}
        className="sm:max-w-135 border-l border-border/40 bg-background flex flex-col p-0"
      >
        <CrudSheetHeader
          title={t('todos.sheet.editTitle', 'Edit Task')}
          description={t('todos.sheet.editDescription', 'Update task details.')}
          onClose={onClose}
        />
        <div className="flex-1 overflow-y-auto p-6">
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
        </div>
      </SheetContent>
    </Sheet>
  )
}
