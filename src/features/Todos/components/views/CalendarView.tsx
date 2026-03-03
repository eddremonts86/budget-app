import { addDays, addMonths, addWeeks, subDays, subMonths, subWeeks } from 'date-fns'
import { Loader2 } from 'lucide-react'
import * as React from 'react'
import { useInfiniteTodos } from '../../api/todos.queries'
import type { Todo } from '../../model/types'
import { CalendarContent, type CalendarMode } from './CalendarContent'

interface CalendarViewProps {
  onEdit: (todo: Todo) => void
  onCreateWithDate?: (date: Date) => void
}

export function CalendarView({ onEdit, onCreateWithDate }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [mode, setMode] = React.useState<CalendarMode>('month')
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteTodos(100)

  // Load more automatically to fill calendar
  React.useEffect(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const allTodos = React.useMemo(() => data?.pages.flatMap((p) => p.data) ?? [], [data])

  const next = () => {
    if (mode === 'month') setCurrentDate(addMonths(currentDate, 1))
    if (mode === 'week') setCurrentDate(addWeeks(currentDate, 1))
    if (mode === 'day') setCurrentDate(addDays(currentDate, 1))
  }

  const prev = () => {
    if (mode === 'month') setCurrentDate(subMonths(currentDate, 1))
    if (mode === 'week') setCurrentDate(subWeeks(currentDate, 1))
    if (mode === 'day') setCurrentDate(subDays(currentDate, 1))
  }

  const goToToday = () => setCurrentDate(new Date())

  if (isLoading && !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <CalendarContent
      currentDate={currentDate}
      mode={mode}
      todos={allTodos}
      onEdit={onEdit}
      onCreateWithDate={onCreateWithDate}
      onNext={next}
      onPrev={prev}
      onToday={goToToday}
      onModeChange={setMode}
    />
  )
}
