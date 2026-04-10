import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  Skeleton,
} from '@/components/ui'
import { useUsersByIds } from '@/modules/users'
import { cn } from '@/shared/utils'
import { format } from 'date-fns'
import { Filter, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUpcomingTodos } from '../../api/todos.queries'
import { WidgetRefreshButton, WidgetRefreshingIndicator } from '@/modules/core/widget'

interface UserFilterProps {
  users: Array<{ id: string; name: string; avatar?: string | null }>
  selectedUsers: Set<string>
  onSelectionChange: (selected: Set<string>) => void
}

/**
 * Component for filtering users with search and multi-select capabilities.
 */
function UserFilter({ users, selectedUsers, onSelectionChange }: UserFilterProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [isOpen, setIsOpen] = useState(false)

  const filteredUsers = useMemo(() => {
    if (!search) return users
    return users.filter((user) => user.name.toLowerCase().includes(search.toLowerCase()))
  }, [users, search])

  const toggleUser = (userId: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(userId)) {
      newSelected.delete(userId)
    } else {
      newSelected.add(userId)
    }
    onSelectionChange(newSelected)
  }

  const clearFilters = () => {
    onSelectionChange(new Set())
    setSearch('')
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <Filter className="mr-2 h-4 w-4" />
          {t('dashboard.upcomingTasks.filterByResponsible', 'Responsible')}
          {selectedUsers.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal @2xl:hidden">
                {selectedUsers.size}
              </Badge>
              <div className="hidden space-x-1 @2xl:flex">
                {selectedUsers.size > 2 ? (
                  <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                    {selectedUsers.size} {t('common.selected', 'selected')}
                  </Badge>
                ) : (
                  users
                    .filter((u) => selectedUsers.has(u.id))
                    .map((u) => (
                      <Badge key={u.id} variant="secondary" className="rounded-sm px-1 font-normal">
                        {u.name}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-50 p-0" align="start">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search', 'Search...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
        </div>
        <Separator />
        <div className="max-h-75 overflow-y-auto p-1">
          {filteredUsers.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t('common.noResults', 'No results found.')}
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                role="button"
                tabIndex={0}
                className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                onClick={() => toggleUser(user.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    toggleUser(user.id)
                  }
                }}
              >
                <Checkbox
                  checked={selectedUsers.has(user.id)}
                  onCheckedChange={() => toggleUser(user.id)}
                  id={`user-${user.id}`}
                />
                <label
                  htmlFor={`user-${user.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                >
                  {user.name}
                </label>
              </div>
            ))
          )}
        </div>
        {selectedUsers.size > 0 && (
          <>
            <Separator />
            <div className="p-1">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center text-center font-normal"
                onClick={clearFilters}
              >
                {t('common.clearFilters', 'Clear filters')}
              </Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

export function UpcomingTodosList() {
  const { t } = useTranslation()
  const {
    data: upcomingPayload,
    isLoading: isLoadingTodos,
    isFetching: isFetchingTodos,
    refetch,
  } = useUpcomingTodos()
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())
  const todos = upcomingPayload?.items ?? []
  const nextWeekCount = upcomingPayload?.nextWeekCount ?? 0
  const displayMode = upcomingPayload?.displayMode ?? 'upcoming'
  const displayCount = upcomingPayload?.displayCount ?? todos.length

  const assigneeIds = Array.from(
    new Set(
      todos
        .map((todo) => todo.assignedTo)
        .filter((assignedUserId): assignedUserId is string => Boolean(assignedUserId)),
    ),
  )

  const { data: users = [], isLoading: isLoadingUsers } = useUsersByIds(assigneeIds)

  const isLoading = isLoadingTodos || isLoadingUsers

  const todoList =
    selectedUserIds.size === 0
      ? todos
      : todos.filter((todo) => todo.assignedTo && selectedUserIds.has(todo.assignedTo))

  const userMap = useMemo(() => {
    return new Map(users.map((u) => [u.id, u]))
  }, [users])

  const statusLabels: Record<string, string> = {
    pending: t('todos.status.pending', 'Pending'),
    in_progress: t('todos.status.inProgress', 'In Progress'),
    completed: t('todos.status.completed', 'Completed'),
  }

  const getInitials = (name: string) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0] || '')
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const groupedTodos = (() => {
    const byUser = new Map<
      string,
      {
        userId: string
        userName: string
        avatar?: string | null
        tasks: typeof todoList
      }
    >()

    const sortedTodos = [...todoList].sort((a, b) => {
      const aUser = a.assignedTo ? userMap.get(a.assignedTo) : undefined
      const bUser = b.assignedTo ? userMap.get(b.assignedTo) : undefined
      const aName = aUser?.name ?? t('todos.unassigned', 'Unassigned')
      const bName = bUser?.name ?? t('todos.unassigned', 'Unassigned')
      const byUserName = aName.localeCompare(bName)
      if (byUserName !== 0) return byUserName
      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER
      return aDue - bDue
    })

    for (const todo of sortedTodos) {
      const assignedUser = todo.assignedTo ? userMap.get(todo.assignedTo) : undefined
      const userId = assignedUser?.id ?? '__unassigned__'
      const userName = assignedUser?.name ?? t('todos.unassigned', 'Unassigned')
      const avatar = assignedUser?.avatar
      const existing = byUser.get(userId)

      if (existing) {
        existing.tasks.push(todo)
        continue
      }

      byUser.set(userId, {
        userId,
        userName,
        avatar,
        tasks: [todo],
      })
    }

    return Array.from(byUser.values())
  })()

  if (isLoading) {
    // Basic Skeleton loading
    return (
      <Card className="col-span-7">
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/4 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(['todo-1', 'todo-2', 'todo-3'] as const).map((id) => (
              <Skeleton key={id} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-7">
      <CardHeader className="flex flex-col gap-3 @md:flex-row @md:items-start @md:justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>
            {t('dashboard.upcomingTasks.title', 'Upcoming Tasks (Next 7 Days)')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.upcomingTasks.description', 'Tasks due this week.')}
          </CardDescription>
          <div className="mt-1 flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full">
              {displayMode === 'upcoming'
                ? t('dashboard.upcomingTasks.nextWeekCount', {
                    defaultValue: '{{count}} tasks next 7 days',
                    count: nextWeekCount,
                  })
                : t('dashboard.upcomingTasks.fallbackCount', {
                    defaultValue:
                      '{{nextWeekCount}} next 7 days • showing {{displayCount}} overdue',
                    nextWeekCount,
                    displayCount,
                  })}
            </Badge>
            {selectedUserIds.size > 0 ? (
              <Badge variant="outline" className="rounded-full">
                {t('dashboard.upcomingTasks.filteredCount', {
                  defaultValue: '{{count}} visible',
                  count: todoList.length,
                })}
              </Badge>
            ) : null}
          </div>
          {isFetchingTodos ? (
            <div className="mt-1">
              <WidgetRefreshingIndicator />
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {users.length > 0 && (
            <UserFilter
              users={users}
              selectedUsers={selectedUserIds}
              onSelectionChange={setSelectedUserIds}
            />
          )}
          <WidgetRefreshButton
            isRefreshing={isFetchingTodos}
            onRefresh={() => {
              void refetch()
            }}
            label={t('dashboard.actions.refreshUpcomingTasks', {
              defaultValue: 'Refresh upcoming tasks',
            })}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="relative max-h-100 overflow-y-auto">
          {todoList.length === 0 ? (
            <div className="flex h-24 items-center justify-center text-center text-sm text-muted-foreground">
              {selectedUserIds.size > 0
                ? t(
                    'dashboard.upcomingTasks.noFilteredResults',
                    'No tasks found for selected filters.',
                  )
                : t('dashboard.upcomingTasks.noTasks', 'No upcoming tasks for this week.')}
            </div>
          ) : (
            <div className="space-y-3 pr-1">
              {groupedTodos.map((group) => (
                <div key={group.userId} className="rounded-xl border bg-muted/20 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src={group.avatar || undefined} alt={group.userName} />
                        <AvatarFallback className="text-[10px]">
                          {getInitials(group.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="truncate text-sm font-medium">{group.userName}</p>
                    </div>
                    <Badge variant="secondary" className="rounded-full">
                      {t('dashboard.upcomingTasks.taskCount', {
                        defaultValue: '{{count}} tasks',
                        count: group.tasks.length,
                      })}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {group.tasks.map((todo) => (
                      <div
                        key={todo.id}
                        className="flex flex-col gap-2 rounded-lg border bg-background/80 px-3 py-2"
                      >
                        <p className="text-sm font-medium leading-tight">{todo.title}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <Badge variant={todo.status === 'completed' ? 'default' : 'secondary'}>
                            {statusLabels[todo.status] || todo.status}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={cn(
                              todo.priority === 'high' && 'text-red-500 border-red-200',
                              todo.priority === 'medium' && 'text-yellow-500 border-yellow-200',
                              todo.priority === 'low' && 'text-green-500 border-green-200',
                            )}
                          >
                            {t(`todos.priority.${todo.priority}`, todo.priority)}
                          </Badge>
                          <span className="text-muted-foreground">
                            {t('todos.table.dueDate', 'Due Date')}:{' '}
                            {todo.dueDate ? format(new Date(todo.dueDate), 'MMM d') : '-'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
