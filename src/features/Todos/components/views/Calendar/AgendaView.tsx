import { format, isToday } from 'date-fns'
import { Clock } from 'lucide-react'
import * as React from 'react'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/shared/lib/utils'
import type { Todo } from '../../../model/types'

interface AgendaViewProps {
  todos: Todo[]
  onEdit: (todo: Todo) => void
  statusColors: Record<string, string>
}

export function AgendaView({ todos, onEdit, statusColors }: AgendaViewProps) {
  // Sort todos by date
  const sortedTodos = React.useMemo(() => {
    return [...todos]
      .filter((t) => t.dueDate)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }, [todos])

  // Group by date
  const groupedTodos = React.useMemo(() => {
    const groups: Record<string, Todo[]> = {}
    sortedTodos.forEach((todo) => {
      const dateKey = todo.dueDate.split('T')[0]
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(todo)
    })
    return groups
  }, [sortedTodos])

  return (
    <div className="flex-1 flex flex-col min-h-0 border-t border-border/40 overflow-hidden bg-secondary/5">
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-8 max-w-3xl mx-auto">
          {Object.entries(groupedTodos).length === 0 && (
            <div className="text-center py-12 text-muted-foreground">No events scheduled.</div>
          )}
          {Object.entries(groupedTodos).map(([dateKey, dayTodos]) => {
            const date = new Date(dateKey)
            return (
              <div key={dateKey} className="flex gap-4 group">
                {/* Date Column */}
                <div className="w-24 shrink-0 flex flex-col items-center pt-1">
                  <span
                    className={cn(
                      'text-xs font-bold uppercase tracking-wider',
                      isToday(date) ? 'text-primary' : 'text-muted-foreground',
                    )}
                  >
                    {format(date, 'EEE')}
                  </span>
                  <div
                    className={cn(
                      'text-2xl font-bold mt-1 h-10 w-10 flex items-center justify-center rounded-full',
                      isToday(date) ? 'bg-primary text-primary-foreground' : 'text-foreground',
                    )}
                  >
                    {format(date, 'd')}
                  </div>
                </div>

                {/* Events Column */}
                <div className="flex-1 space-y-3 pb-8 border-l border-border/40 pl-6 relative">
                  {/* Timeline dot */}
                  <div className="absolute left-[-5px] top-2 w-2.5 h-2.5 rounded-full border-2 border-background bg-border" />

                  {dayTodos.map((todo) => (
                    <div
                      key={todo.id}
                      onClick={() => onEdit(todo)}
                      className="bg-card hover:bg-card/80 transition-colors border border-border/40 rounded-xl p-4 shadow-sm cursor-pointer flex flex-col sm:flex-row gap-4 sm:items-center"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-base">{todo.title}</h4>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] h-5 px-1.5', statusColors[todo.status])}
                          >
                            {todo.status.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {todo.description}
                        </p>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                        {todo.dueDate.includes('T') && (
                          <div className="flex items-center gap-1.5 bg-secondary/30 px-2 py-1 rounded-md">
                            <Clock className="w-3.5 h-3.5" />
                            {format(new Date(todo.dueDate), 'h:mm a')}
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full',
                              todo.priority === 'high'
                                ? 'bg-destructive'
                                : todo.priority === 'medium'
                                  ? 'bg-orange-500'
                                  : 'bg-green-500',
                            )}
                          />
                          <span className="capitalize">{todo.priority}</span>
                        </div>
                      </div>
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
