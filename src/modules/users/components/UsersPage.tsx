import { m } from 'framer-motion'
import { Search, X, Trash2, UserPlus } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useInView } from 'react-intersection-observer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CrudSheetBody, CrudSheetContent, CrudSheetHeader } from '@/components/ui/crud-sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useCategories } from '@/modules/categories'
import { useProjects } from '@/modules/projects'
import { useTeams } from '@/modules/team'
import { toast } from '@/shared/lib/toast'
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

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } =
    useInfiniteUsers(10, deferredSearch, { projectId, teamId, categoryId })

  const { ref, inView } = useInView()

  const hasActiveFilters = Boolean(search.trim() || projectId || teamId || categoryId)

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

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
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex h-100 items-center justify-center"
      >
        <div className="text-center space-y-4 max-w-sm">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight">{t('users.error.title')}</h2>
            <p className="text-muted-foreground text-sm">{t('users.error.description')}</p>
          </div>
          <Button variant="outline" onClick={() => window.location.reload()}>
            {t('users.error.retry')}
          </Button>
        </div>
      </m.div>
    )
  }

  const allUsers = data?.pages.flatMap((page) => page.data) ?? []
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
    <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 shrink-0">
        <div className="space-y-1">
          <h2 className="bg-linear-to-r from-foreground to-foreground/70 bg-clip-text text-4xl font-bold tracking-tight">
            {t('users.title')}
          </h2>
          <p className="text-muted-foreground font-medium">
            {t('users.subtitlePrefix')}
            <span className="text-foreground">{totalCount}</span>
            {t('users.subtitleSuffix')}
          </p>
        </div>
        <Button
          onClick={() => setIsCreateOpen(true)}
          className="rounded-2xl h-12 px-6 gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
        >
          <UserPlus className="w-5 h-5" />
          {t('users.actions.new')}
        </Button>
      </div>

      <div className="grid gap-3 rounded-3xl border border-border/40 bg-card/60 p-4 md:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))_auto] md:items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => {
              const nextValue = event.target.value
              React.startTransition(() => {
                setSearch(nextValue)
              })
            }}
            placeholder={t('users.filters.search', { defaultValue: 'Search users...' })}
            className="h-11 rounded-2xl border-dashed border-border/60 bg-background pl-10"
          />
        </div>

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
        <div className="space-y-4">
          <Skeleton className="h-16 w-full rounded-3xl" />
          <Skeleton className="h-16 w-full rounded-3xl" />
          <Skeleton className="h-16 w-full rounded-3xl" />
        </div>
      ) : (
        <div className="relative group flex-1 min-h-0 flex flex-col">
          <UserTable
            users={allUsers}
            onEdit={setEditingUser}
            onDelete={handleDelete}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onFetchNextPage={fetchNextPage}
            scrollRef={ref}
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
