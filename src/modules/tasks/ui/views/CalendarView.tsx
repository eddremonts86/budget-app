import {
  addDays,
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
  subWeeks,
} from 'date-fns'
import { Loader2 } from 'lucide-react'
import * as React from 'react'
import { useTodosByDateRange } from '../../api/todos.queries'
import type { Todo } from '../../model/types'
import { CalendarContent, type CalendarMode } from './CalendarContent'

interface CalendarViewProps {
  onEdit: (todo: Todo) => void
  onCreateWithDate?: (date: Date) => void
  assignedTo?: string
  status?: string
}

function getDateRange(date: Date, mode: CalendarMode): { startDate: string; endDate: string } {
  let start: Date
  let end: Date

  if (mode === 'month') {
    // Extend by 1 week either side to cover partial weeks shown in month grid
    start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 })
    end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 })
  } else if (mode === 'week') {
    start = startOfWeek(date, { weekStartsOn: 1 })
    end = endOfWeek(date, { weekStartsOn: 1 })
  } else if (mode === 'day') {
    start = new Date(date)
    start.setHours(0, 0, 0, 0)
    end = new Date(date)
    end.setHours(23, 59, 59, 999)
  } else {
    // agenda: next 60 days
    start = new Date()
    start.setHours(0, 0, 0, 0)
    end = addDays(start, 60)
  }

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString(),
  }
}

export function CalendarView({ onEdit, onCreateWithDate, assignedTo, status }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date())
  const [mode, setMode] = React.useState<CalendarMode>('month')

  const { startDate, endDate } = React.useMemo(
    () => getDateRange(currentDate, mode),
    [currentDate, mode],
  )

  const { data: allTodos = [], isLoading } = useTodosByDateRange(
    startDate,
    endDate,
    assignedTo,
    status as Parameters<typeof useTodosByDateRange>[3],
  )

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

  if (isLoading) {
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
      todos={allTodos as Todo[]}
      onEdit={onEdit}
      onCreateWithDate={onCreateWithDate}
      onNext={next}
      onPrev={prev}
      onToday={goToToday}
      onModeChange={setMode}
    />
  )
}
