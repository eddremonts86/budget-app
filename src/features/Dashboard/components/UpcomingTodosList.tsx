import { format } from 'date-fns'
import { Filter, Search } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Checkbox,
  Input,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Separator,
} from '@/components/ui'
import { cn } from '@/shared/utils'
import { useUsers } from '../../Users/api/users.queries'
import { useUpcomingTodos } from '../api/dashboard.queries'

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
              <Badge variant="secondary" className="rounded-sm px-1 font-normal lg:hidden">
                {selectedUsers.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
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
      <PopoverContent className="w-[200px] p-0" align="start">
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
        <div className="max-h-[300px] overflow-y-auto p-1">
          {filteredUsers.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              {t('common.noResults', 'No results found.')}
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div
                key={user.id}
                className="flex items-center space-x-2 rounded-sm px-2 py-1.5 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                onClick={() => toggleUser(user.id)}
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
  const { data: todos, isLoading: isLoadingTodos } = useUpcomingTodos()
  const { data: users, isLoading: isLoadingUsers } = useUsers()
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set())

  const isLoading = isLoadingTodos || isLoadingUsers

  const todoList = useMemo(() => {
    const list = Array.isArray(todos) ? todos : []
    if (selectedUserIds.size === 0) return list
    return list.filter((todo) => todo.assignedTo && selectedUserIds.has(todo.assignedTo))
  }, [todos, selectedUserIds])

  const userMap = useMemo(() => {
    if (!users) return new Map()
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

  if (isLoading) {
    // Basic Skeleton loading
    return (
      <Card className="col-span-7">
        <CardHeader>
          <div className="h-6 w-1/3 bg-muted rounded animate-pulse" />
          <div className="h-4 w-1/4 bg-muted rounded animate-pulse mt-2" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="col-span-7">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle>
            {t('dashboard.upcomingTasks.title', 'Upcoming Tasks (Next 7 Days)')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.upcomingTasks.description', 'Tasks due this week.')}
          </CardDescription>
        </div>
        {users && (
          <UserFilter
            users={users}
            selectedUsers={selectedUserIds}
            onSelectionChange={setSelectedUserIds}
          />
        )}
      </CardHeader>
      <CardContent>
        <div className="max-h-[400px] overflow-y-auto relative">
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10">
              <TableRow>
                <TableHead>{t('todos.table.title', 'Task')}</TableHead>
                <TableHead>{t('todos.table.assignedTo', 'Assigned To')}</TableHead>
                <TableHead>{t('todos.table.status', 'Status')}</TableHead>
                <TableHead>{t('todos.table.priority', 'Priority')}</TableHead>
                <TableHead className="text-right">{t('todos.table.dueDate', 'Due Date')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {todoList.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                    {selectedUserIds.size > 0
                      ? t(
                          'dashboard.upcomingTasks.noFilteredResults',
                          'No tasks found for selected filters.',
                        )
                      : t('dashboard.upcomingTasks.noTasks', 'No upcoming tasks for this week.')}
                  </TableCell>
                </TableRow>
              ) : (
                todoList.map((todo) => {
                  const assignedUser = userMap.get(todo.assignedTo)
                  return (
                    <TableRow key={todo.id}>
                      <TableCell className="font-medium">{todo.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarImage
                              src={assignedUser?.avatar || undefined}
                              alt={assignedUser?.name}
                            />
                            <AvatarFallback className="text-[10px]">
                              {assignedUser ? getInitials(assignedUser.name) : '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm text-muted-foreground">
                            {assignedUser?.name || 'Unassigned'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={todo.status === 'completed' ? 'default' : 'secondary'}>
                          {statusLabels[todo.status] || todo.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="text-right">
                        {todo.dueDate ? format(new Date(todo.dueDate), 'MMM d') : '-'}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
