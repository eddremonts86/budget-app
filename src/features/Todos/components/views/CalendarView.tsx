import { addDays, addMonths, addWeeks, format, subDays, subMonths, subWeeks } from 'date-fns'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useInfiniteTodos } from '../../api/todos.queries'
import type { Todo } from '../../model/types'
import { AgendaView } from './Calendar/AgendaView'
import { DayView } from './Calendar/DayView'
import { MonthView } from './Calendar/MonthView'
import { WeekView } from './Calendar/WeekView'

interface CalendarViewProps {
  onEdit: (todo: Todo) => void
  onCreateWithDate?: (date: Date) => void
}

type CalendarMode = 'month' | 'week' | 'day' | 'agenda'

export function CalendarView({ onEdit, onCreateWithDate }: CalendarViewProps) {
  const { t } = useTranslation()
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

  const statusColors = {
    completed: 'bg-emerald-500/20 text-emerald-600 border-emerald-200',
    in_progress: 'bg-blue-500/20 text-blue-600 border-blue-200',
    pending: 'bg-amber-500/20 text-amber-600 border-amber-200',
  }

  if (isLoading && !data) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <Card className="flex flex-col h-full border-border/40 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 py-4">
        <div className="flex items-center gap-4">
          <CardTitle className="text-xl font-semibold capitalize min-w-[200px]">
            {mode === 'month' && format(currentDate, 'MMMM yyyy')}
            {mode === 'week' && `Week of ${format(currentDate, 'MMM d, yyyy')}`}
            {mode === 'day' && format(currentDate, 'MMMM d, yyyy')}
            {mode === 'agenda' && 'Agenda'}
          </CardTitle>
          {mode !== 'agenda' && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" onClick={prev} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={next} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday} className="h-8 ml-2">
                {t('common.today', 'Today')}
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={mode} onValueChange={(v) => setMode(v as CalendarMode)}>
            <SelectTrigger className="w-[120px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
              <SelectItem value="day">Day</SelectItem>
              <SelectItem value="agenda">Agenda</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col min-h-0">
        {mode === 'month' && (
          <MonthView
            currentDate={currentDate}
            todos={allTodos}
            onEdit={onEdit}
            onCreateWithDate={onCreateWithDate || (() => {})}
            statusColors={statusColors}
          />
        )}
        {mode === 'week' && (
          <WeekView
            currentDate={currentDate}
            todos={allTodos}
            onEdit={onEdit}
            onCreateWithDate={onCreateWithDate || (() => {})}
            statusColors={statusColors}
          />
        )}
        {mode === 'day' && (
          <DayView
            currentDate={currentDate}
            todos={allTodos}
            onEdit={onEdit}
            onCreateWithDate={onCreateWithDate || (() => {})}
            statusColors={statusColors}
          />
        )}
        {mode === 'agenda' && (
          <AgendaView todos={allTodos} onEdit={onEdit} statusColors={statusColors} />
        )}
      </CardContent>
    </Card>
  )
}
