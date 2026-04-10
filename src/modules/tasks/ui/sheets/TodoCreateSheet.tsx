import { useTranslation } from 'react-i18next'
import { CrudSheetHeader } from '@/components/ui/crud-sheet'
import { Sheet, SheetContent } from '@/components/ui/sheet'
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
      <SheetContent
        showCloseButton={false}
        className="sm:max-w-135 border-l border-border/40 bg-background flex flex-col p-0"
      >
        <CrudSheetHeader
          title={t('todos.sheet.createTitle', 'Create Task')}
          description={t('todos.sheet.createDescription', 'Add a new task to your list.')}
          onClose={() => onOpenChange(false)}
        />
        <div className="flex-1 overflow-y-auto p-6">
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
        </div>
      </SheetContent>
    </Sheet>
  )
}
