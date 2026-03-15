import { eachDayOfInterval, endOfWeek, format, isSameDay, isToday, startOfWeek } from 'date-fns'
import { Plus } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/shared/lib/utils'
import type { Todo } from '../../../model/types'

interface WeekViewProps {
  currentDate: Date
  todos: Todo[]
  onEdit: (todo: Todo) => void
  onCreateWithDate: (date: Date) => void
  statusColors: Record<string, string>
}

export function WeekView({
  currentDate,
  todos,
  onEdit,
  onCreateWithDate,
  statusColors,
}: WeekViewProps) {
  const days = React.useMemo(() => {
    const start = startOfWeek(currentDate)
    const end = endOfWeek(currentDate)
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  // Mock hours for now
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const getTodosForDayAndHour = (day: Date, hour: number) => {
    return todos.filter((todo) => {
      if (!todo.dueDate) return false
      const todoDate = new Date(todo.dueDate)
      // Check if same day
      if (!isSameDay(todoDate, day)) return false

      // Check if same hour (if time exists in dueDate)
      // If dueDate is YYYY-MM-DD (length 10), it has no time -> treat as all day or hour 0?
      // If dueDate is ISO (length > 10), check hour
      if (todo.dueDate.length > 10) {
        return todoDate.getHours() === hour
      }

      // If no time, maybe show in first hour or separate section?
      // For now, let's put them in 9 AM slot just to see them
      return hour === 9
    })
  }

  const getAllDayTodos = (day: Date) => {
    return todos.filter((todo) => {
      if (!todo.dueDate) return false
      const todoDate = new Date(todo.dueDate)
      // If date string length is 10 (YYYY-MM-DD), it's all day
      return isSameDay(todoDate, day) && todo.dueDate.length <= 10
    })
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 border-t border-border/40 overflow-hidden">
      {/* Week Header */}
      <div className="grid grid-cols-8 border-b border-border/40 bg-secondary/10 shrink-0">
        <div className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider border-r border-border/40 w-16">
          Time
        </div>
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              'py-2 text-center text-xs font-semibold uppercase tracking-wider border-r border-border/40 last:border-r-0',
              isToday(day) ? 'text-primary' : 'text-muted-foreground',
            )}
          >
            {format(day, 'EEE d')}
          </div>
        ))}
      </div>

      {/* Week Grid */}
      <ScrollArea className="flex-1">
        <div className="grid grid-cols-8 divide-x divide-border/40">
          {/* Time Column */}
          <div className="w-16 flex flex-col divide-y divide-border/40 bg-secondary/5">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-16 flex items-start justify-center pt-2 text-xs text-muted-foreground font-mono"
              >
                {format(new Date().setHours(hour, 0, 0, 0), 'h a')}
              </div>
            ))}
          </div>

          {/* Days Columns */}
          {days.map((day) => {
            const dayAllDayTodos = getAllDayTodos(day)
            return (
              <div
                key={day.toISOString()}
                className="flex flex-col divide-y divide-border/40 relative group"
              >
                {/* All Day Section (Optional, sticking to top or inside grid?) */}
                {/* Let's put regular grid for now */}
                {hours.map((hour) => {
                  // If hour is 9, show all day todos too for demo if needed
                  // But actually, let's mix them based on logic above
                  const slotTodos = getTodosForDayAndHour(day, hour)

                  return (
                    <div
                      key={hour}
                      className="h-16 relative hover:bg-secondary/5 transition-colors group/slot"
                      onClick={() => {
                        const dateWithTime = new Date(day)
                        dateWithTime.setHours(hour)
                        onCreateWithDate(dateWithTime)
                      }}
                    >
                      {/* Quick Add Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-4 w-4 opacity-0 group-hover/slot:opacity-100 transition-opacity z-10"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>

                      <div className="p-1 space-y-1">
                        {(hour === 9 ? [...dayAllDayTodos, ...slotTodos] : slotTodos).map(
                          (todo) => (
                            <div
                              key={todo.id}
                              onClick={(e) => {
                                e.stopPropagation()
                                onEdit(todo)
                              }}
                              className={cn(
                                'px-1.5 py-0.5 text-[10px] rounded-sm truncate cursor-pointer border hover:opacity-80 transition-opacity font-medium shadow-sm',
                                statusColors[todo.status as keyof typeof statusColors] ||
                                  'bg-secondary text-secondary-foreground',
                              )}
                              title={todo.title}
                            >
                              {todo.title}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
