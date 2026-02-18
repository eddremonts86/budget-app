import { Calendar, Kanban, List } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type TodoViewType = 'list' | 'kanban' | 'calendar'

interface ViewSwitcherProps {
  view: TodoViewType
  onViewChange: (view: TodoViewType) => void
}

export function ViewSwitcher({ view, onViewChange }: ViewSwitcherProps) {
  const { t } = useTranslation()

  return (
    <Tabs value={view} onValueChange={(v) => onViewChange(v as TodoViewType)} className="w-auto">
      <TabsList className="grid w-full grid-cols-3 h-10">
        <TabsTrigger value="list" className="px-4 gap-2">
          <List className="h-4 w-4" />
          <span className="hidden sm:inline">{t('todos.views.list', 'List')}</span>
        </TabsTrigger>
        <TabsTrigger value="kanban" className="px-4 gap-2">
          <Kanban className="h-4 w-4" />
          <span className="hidden sm:inline">{t('todos.views.kanban', 'Kanban')}</span>
        </TabsTrigger>
        <TabsTrigger value="calendar" className="px-4 gap-2">
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">{t('todos.views.calendar', 'Calendar')}</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
