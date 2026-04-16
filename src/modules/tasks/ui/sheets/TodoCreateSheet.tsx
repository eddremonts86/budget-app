import { useTranslation } from 'react-i18next'
import { CrudSheetBody, CrudSheetContent, CrudSheetHeader } from '@/components/ui/crud-sheet'
import { Sheet } from '@/components/ui/sheet'
import { useCreateTodo } from '../../api/todos.queries'
import type { Todo } from '../../model/types'
import { TodoForm } from '../TodoForm'

interface TodoCreateSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultValues: Partial<Todo>
  currentUserId: string
  onCreated: () => void
}

export function TodoCreateSheet({
  open,
  onOpenChange,
  defaultValues,
  currentUserId,
  onCreated,
}: TodoCreateSheetProps) {
  const { t } = useTranslation()
  const createMutation = useCreateTodo()

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <CrudSheetContent>
        <CrudSheetHeader
          title={t('todos.sheet.createTitle', 'Create Task')}
          description={t('todos.sheet.createDescription', 'Add a new task to your list.')}
          onClose={() => onOpenChange(false)}
        />
        <CrudSheetBody>
          {open && (
            <TodoForm
              defaultValues={defaultValues}
              currentUserId={currentUserId}
              onSubmit={async (values) => {
                await createMutation.mutateAsync({
                  ...values,
                  assignedTo: values.assignedTo || currentUserId,
                })
                onCreated()
              }}
              onCancel={() => onOpenChange(false)}
              isLoading={createMutation.isPending}
            />
          )}
        </CrudSheetBody>
      </CrudSheetContent>
    </Sheet>
  )
}
