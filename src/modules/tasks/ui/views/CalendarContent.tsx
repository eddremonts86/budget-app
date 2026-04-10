import { format } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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
import type { Todo } from '../../model/types'
import { AgendaView } from './Calendar/AgendaView'
import { DayView } from './Calendar/DayView'
import { MonthView } from './Calendar/MonthView'
import { WeekView } from './Calendar/WeekView'

export type CalendarMode = 'month' | 'week' | 'day' | 'agenda'

interface CalendarContentProps {
  currentDate: Date
  mode: CalendarMode
  todos: Todo[]
  onEdit: (todo: Todo) => void
  onCreateWithDate?: (date: Date) => void
  onNext: () => void
  onPrev: () => void
  onToday: () => void
  onModeChange: (mode: CalendarMode) => void
}

export function CalendarContent({
  currentDate,
  mode,
  todos,
  onEdit,
  onCreateWithDate,
  onNext,
  onPrev,
  onToday,
  onModeChange,
}: CalendarContentProps) {
  const { t } = useTranslation()

  const statusColors = {
    completed: 'bg-emerald-500/20 text-emerald-600 border-emerald-200',
    in_progress: 'bg-blue-500/20 text-blue-600 border-blue-200',
    pending: 'bg-amber-500/20 text-amber-600 border-amber-200',
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
              <Button variant="outline" size="icon" onClick={onPrev} className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={onNext} className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={onToday} className="h-8 ml-2">
                {t('common.today', 'Today')}
              </Button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select value={mode} onValueChange={(v) => onModeChange(v as CalendarMode)}>
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
            todos={todos}
            onEdit={onEdit}
            onCreateWithDate={onCreateWithDate || (() => {})}
            statusColors={statusColors}
          />
        )}
        {mode === 'week' && (
          <WeekView
            currentDate={currentDate}
            todos={todos}
            onEdit={onEdit}
            onCreateWithDate={onCreateWithDate || (() => {})}
            statusColors={statusColors}
          />
        )}
        {mode === 'day' && (
          <DayView
            currentDate={currentDate}
            todos={todos}
            onEdit={onEdit}
            onCreateWithDate={onCreateWithDate || (() => {})}
            statusColors={statusColors}
          />
        )}
        {mode === 'agenda' && (
          <AgendaView todos={todos} onEdit={onEdit} statusColors={statusColors} />
        )}
      </CardContent>
    </Card>
  )
}
