import { format, isSameDay, isToday } from 'date-fns'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/shared/lib/utils'
import type { Todo } from '../../../model/types'

interface DayViewProps {
  currentDate: Date
  todos: Todo[]
  onEdit: (todo: Todo) => void
  onCreateWithDate: (date: Date) => void
  statusColors: Record<string, string>
}

export function DayView({
  currentDate,
  todos,
  onEdit,
  onCreateWithDate,
  statusColors,
}: DayViewProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i)

  const getTodosForHour = (hour: number) => {
    return todos.filter((todo) => {
      if (!todo.dueDate) return false
      const todoDate = new Date(todo.dueDate)
      if (!isSameDay(todoDate, currentDate)) return false

      if (todo.dueDate.length > 10) {
        return todoDate.getHours() === hour
      }
      return hour === 9 // Default all-day tasks to 9 AM for visibility
    })
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 border-t border-border/40 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-center py-4 border-b border-border/40 bg-secondary/10 shrink-0">
        <h2 className={cn('text-lg font-semibold', isToday(currentDate) && 'text-primary')}>
          {format(currentDate, 'EEEE, MMMM d, yyyy')}
        </h2>
      </div>

      {/* Hourly Grid */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col divide-y divide-border/40">
          {hours.map((hour) => {
            const hourTodos = getTodosForHour(hour)
            const dateWithTime = new Date(currentDate)
            dateWithTime.setHours(hour, 0, 0, 0)

            return (
              <div
                key={hour}
                className="flex min-h-[80px] group hover:bg-secondary/5 transition-colors relative"
                onClick={() => onCreateWithDate(dateWithTime)}
              >
                {/* Time Label */}
                <div className="w-20 py-4 px-3 text-right text-xs text-muted-foreground font-mono border-r border-border/40 shrink-0">
                  {format(dateWithTime, 'h a')}
                </div>

                {/* Tasks Area */}
                <div className="flex-1 p-2 space-y-2 relative">
                  {/* Quick Add Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    onClick={(e) => {
                      e.stopPropagation()
                      onCreateWithDate(dateWithTime)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>

                  {hourTodos.map((todo) => (
                    <div
                      key={todo.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(todo)
                      }}
                      className={cn(
                        'px-3 py-2 text-sm rounded-md border shadow-sm cursor-pointer hover:shadow-md transition-all font-medium flex justify-between items-center',
                        statusColors[todo.status as keyof typeof statusColors] ||
                          'bg-secondary text-secondary-foreground',
                      )}
                    >
                      <span>{todo.title}</span>
                      <span className="text-[10px] opacity-70 uppercase tracking-wider border px-1.5 py-0.5 rounded-full border-current/20">
                        {todo.priority}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </ScrollArea>
    </div>
  )
}
