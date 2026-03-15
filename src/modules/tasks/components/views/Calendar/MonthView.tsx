import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { Plus } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/shared/lib/utils'
import type { Todo } from '../../../model/types'

interface MonthViewProps {
  currentDate: Date
  todos: Todo[]
  onEdit: (todo: Todo) => void
  onCreateWithDate: (date: Date) => void
  statusColors: Record<string, string>
}

export function MonthView({
  currentDate,
  todos,
  onEdit,
  onCreateWithDate,
  statusColors,
}: MonthViewProps) {
  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate))
    const end = endOfWeek(endOfMonth(currentDate))
    return eachDayOfInterval({ start, end })
  }, [currentDate])

  const getTodosForDay = (day: Date) => {
    return todos.filter((todo) => {
      if (!todo.dueDate) return false
      // Parse ISO string properly
      const todoDate = new Date(todo.dueDate)
      return isSameDay(todoDate, day)
    })
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 border-t border-border/40">
      {/* Days Header */}
      <div className="grid grid-cols-7 border-b border-border/40 bg-secondary/10">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div
            key={day}
            className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider"
          >
            {day}
          </div>
        ))}
      </div>
      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-5 md:grid-rows-6 min-h-0">
        {days.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isTodayDate = isToday(day)
          const dayTodos = getTodosForDay(day)

          return (
            <div
              key={day.toISOString()}
              className={cn(
                'relative border-b border-r border-border/40 p-2 transition-colors hover:bg-secondary/5 flex flex-col gap-1 min-h-[80px] group',
                !isCurrentMonth && 'bg-secondary/5 text-muted-foreground/50',
                i % 7 === 0 && 'border-l-0', // Remove left border for first col if needed (not needed with grid)
              )}
              onClick={() => onCreateWithDate(day)}
            >
              <div className="flex items-center justify-between">
                <span
                  className={cn(
                    'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                    isTodayDate
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground group-hover:text-foreground',
                  )}
                >
                  {format(day, 'd')}
                </span>
                {/* Quick Add Button on Hover */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity -mr-1 -mt-1"
                  onClick={(e) => {
                    e.stopPropagation()
                    onCreateWithDate(day)
                  }}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <ScrollArea className="flex-1 -mr-1 pr-1">
                <div className="space-y-1">
                  {dayTodos.map((todo) => (
                    <div
                      key={todo.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(todo)
                      }}
                      className={cn(
                        'px-1.5 py-0.5 text-[10px] rounded-sm truncate cursor-pointer border hover:opacity-80 transition-opacity font-medium',
                        statusColors[todo.status as keyof typeof statusColors] ||
                          'bg-secondary text-secondary-foreground',
                      )}
                      title={todo.title}
                    >
                      {todo.title}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )
        })}
      </div>
    </div>
  )
}
