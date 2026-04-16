import { X, UserPlus } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { CrudSheetBody, CrudSheetContent, CrudSheetHeader } from '@/components/ui/crud-sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet } from '@/components/ui/sheet'
import { useCategories } from '@/modules/categories'
import { useProjects } from '@/modules/projects'
import { useTeams } from '@/modules/team'
import { toast } from '@/shared/lib/toast'
import {
  flattenInfinitePages,
  TableEmptyState,
  TableErrorState,
  TableSearchBar,
  TableSkeleton,
} from '@/shared/ui/tables'
import { useCreateUser, useDeleteUser, useInfiniteUsers, useUpdateUser } from '../api/users.queries'
import type { User } from '../model/types'
import { UserForm } from './UserForm'
import { UserTable } from './UserTable'

export function UsersPage() {
  const { t } = useTranslation()
  const emptyFilterValue = '__all__'
  const [isCreateOpen, setIsCreateOpen] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<User | null>(null)
  const [search, setSearch] = React.useState('')
  const [projectId, setProjectId] = React.useState<string | undefined>()
  const [teamId, setTeamId] = React.useState<string | undefined>()
  const [categoryId, setCategoryId] = React.useState<string | undefined>()
  const deferredSearch = React.useDeferredValue(search)

  const { data: projects = [] } = useProjects()
  const { data: teams = [] } = useTeams()
  const { data: categories = [] } = useCategories()

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isFetching, isError } =
    useInfiniteUsers(10, deferredSearch, { projectId, teamId, categoryId })

  const hasActiveFilters = Boolean(search.trim() || projectId || teamId || categoryId)

  const createMutation = useCreateUser()
  const updateMutation = useUpdateUser()
  const deleteMutation = useDeleteUser()

  const handleDelete = (user: User) => {
    toast.error(t('users.confirm.delete'), {
      description: t('common.confirm'),
      action: {
        label: t('common.delete'),
        onClick: () => deleteMutation.mutate(user.id),
      },
      duration: 10000,
    })
  }

  if (isError) {
    return (
      <TableErrorState
        titleKey="users.error.title"
        descriptionKey="users.error.description"
        retryKey="users.error.retry"
      />
    )
  }

  const allUsers = flattenInfinitePages<User>(data?.pages)
  const totalCount = data?.pages[0]?.totalCount ?? 0

  const clearFilters = () => {
    React.startTransition(() => {
      setSearch('')
      setProjectId(undefined)
      setTeamId(undefined)
      setCategoryId(undefined)
    })
  }

  return (
    <div className="flex flex-col h-full space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">
            {t('users.title')}
            {totalCount > 0 && (
              <span className="ml-2 text-muted-foreground font-normal text-2xl">
                ({totalCount})
              </span>
            )}
          </h2>
          <p className="text-muted-foreground">
            {t('users.subtitle', 'Manage your team members, roles and permissions.')}
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          {t('users.actions.new')}
        </Button>
      </div>

      <TableSearchBar
        searchInput={search}
        onSearchChange={(value) => React.startTransition(() => setSearch(value))}
        onClear={() => React.startTransition(() => setSearch(''))}
        loadedCount={allUsers.length}
        totalCount={totalCount}
        showSpinner={isFetching && !isFetchingNextPage}
        placeholderKey="users.filters.search"
      />

      <div className="grid gap-3 rounded-3xl border border-border/40 bg-card/60 p-4 md:grid-cols-[repeat(3,minmax(0,1fr))_auto] md:items-center">
        <Select
          value={projectId ?? emptyFilterValue}
          onValueChange={(value) => {
            React.startTransition(() => {
              setProjectId(value === emptyFilterValue ? undefined : value)
            })
          }}
        >
          <SelectTrigger className="h-11 rounded-2xl border-dashed border-border/60 bg-background">
            <SelectValue
              placeholder={t('users.filters.project', { defaultValue: 'All projects' })}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={emptyFilterValue}>
              {t('users.filters.project', { defaultValue: 'All projects' })}
            </SelectItem>
            {projects.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={teamId ?? emptyFilterValue}
          onValueChange={(value) => {
            React.startTransition(() => {
              setTeamId(value === emptyFilterValue ? undefined : value)
            })
          }}
        >
          <SelectTrigger className="h-11 rounded-2xl border-dashed border-border/60 bg-background">
            <SelectValue placeholder={t('users.filters.team', { defaultValue: 'All teams' })} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={emptyFilterValue}>
              {t('users.filters.team', { defaultValue: 'All teams' })}
            </SelectItem>
            {teams.map((team) => (
              <SelectItem key={team.id} value={team.id}>
                {team.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={categoryId ?? emptyFilterValue}
          onValueChange={(value) => {
            React.startTransition(() => {
              setCategoryId(value === emptyFilterValue ? undefined : value)
            })
          }}
        >
          <SelectTrigger className="h-11 rounded-2xl border-dashed border-border/60 bg-background">
            <SelectValue
              placeholder={t('users.filters.category', { defaultValue: 'All categories' })}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={emptyFilterValue}>
              {t('users.filters.category', { defaultValue: 'All categories' })}
            </SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          type="button"
          variant="outline"
          onClick={clearFilters}
          disabled={!hasActiveFilters}
          className="h-11 rounded-2xl border-dashed border-border/60"
        >
          <X className="mr-2 h-4 w-4" />
          {t('common.clear', { defaultValue: 'Clear' })}
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : allUsers.length === 0 ? (
        <TableEmptyState isSearchActive={hasActiveFilters} onClearSearch={clearFilters} />
      ) : (
        <div className="relative group flex-1 min-h-0 flex flex-col">
          <UserTable
            users={allUsers}
            onEdit={setEditingUser}
            onDelete={handleDelete}
            hasNextPage={hasNextPage ?? false}
            isFetchingNextPage={isFetchingNextPage}
            onFetchNextPage={fetchNextPage}
            scrollResetKey={`${deferredSearch}-${projectId}-${teamId}-${categoryId}`}
          />
        </div>
      )}

      {/* Sheets with custom styling */}
      <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <CrudSheetContent className="bg-background/95 shadow-2xl backdrop-blur-xl sm:max-w-135">
          <CrudSheetHeader
            title={t('users.sheet.createTitle')}
            description={t('users.sheet.createDescription')}
            onClose={() => setIsCreateOpen(false)}
          />
          <CrudSheetBody className="p-6">
            <UserForm
              onSubmit={async (values) => {
                await createMutation.mutateAsync(values)
                setIsCreateOpen(false)
              }}
              onCancel={() => setIsCreateOpen(false)}
              isLoading={createMutation.isPending}
            />
          </CrudSheetBody>
        </CrudSheetContent>
      </Sheet>

      <Sheet open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <CrudSheetContent className="bg-background/95 shadow-2xl backdrop-blur-xl sm:max-w-135">
          <CrudSheetHeader
            title={t('users.sheet.editTitle')}
            description={t('users.sheet.editDescription')}
            onClose={() => setEditingUser(null)}
          />
          <CrudSheetBody className="p-6">
            {editingUser && (
              <UserForm
                defaultValues={editingUser}
                onSubmit={async (values) => {
                  await updateMutation.mutateAsync({ id: editingUser.id, data: values })
                  setEditingUser(null)
                }}
                onCancel={() => setEditingUser(null)}
                isLoading={updateMutation.isPending}
              />
            )}
          </CrudSheetBody>
        </CrudSheetContent>
      </Sheet>
    </div>
  )
}
