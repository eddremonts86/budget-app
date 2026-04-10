import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { ViewSwitcher, type TodoViewType } from './ViewSwitcher'

interface TodosHeaderProps {
  totalCount: number
  view: TodoViewType
  onViewChange: (view: TodoViewType) => void
  onCreateNew: () => void
}

export function TodosHeader({ totalCount, view, onViewChange, onCreateNew }: TodosHeaderProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">
          {t('todos.title', 'Tasks')}
          {totalCount > 0 && (
            <span className="ml-2 text-muted-foreground font-normal text-2xl">({totalCount})</span>
          )}
        </h2>
        <p className="text-muted-foreground">
          {t('todos.subtitle', 'Manage your team tasks, track progress and deadlines.')}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <ViewSwitcher view={view} onViewChange={onViewChange} />
        <Button type="button" onClick={onCreateNew} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('todos.actions.new', 'New Task')}
        </Button>
      </div>
    </div>
  )
}
