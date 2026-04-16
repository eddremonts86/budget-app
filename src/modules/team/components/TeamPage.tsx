import { IconEdit, IconTrash, IconUsers } from '@tabler/icons-react'
import { LayoutGrid, List, Plus, Search } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  CrudSheetActions,
  CrudSheetBody,
  CrudSheetContent,
  CrudSheetHeader,
  CrudSheetSection,
} from '@/components/ui/crud-sheet'
import { Input } from '@/components/ui/input'
import { Sheet } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useUserDirectory, useUsersByIds } from '@/modules/users'
import { toast } from '@/shared/lib/toast'
import { cn } from '@/shared/lib/utils'
import { TableErrorState, TableSearchBar, TableSkeleton } from '@/shared/ui/tables'
import { useDebouncedSearch } from '@/shared/ui/tables'
import { UnifiedDataTable } from '@/shared/ui/tables/DataTable'
import { useCreateTeam, useDeleteTeam, useInfiniteTeams, useUpdateTeam } from '../api/teams.queries'
import { useTeamColumns } from '../hooks/useTeamColumns'
import type { TeamWithUsers } from '../model/types'

interface TeamFormState {
  name: string
  description: string
  members: string[]
}

const initialFormState: TeamFormState = {
  name: '',
  description: '',
  members: [],
}

export function TeamPage() {
  const { t } = useTranslation()
  const [viewMode, setViewMode] = React.useState<'cards' | 'table'>('cards')
  const { searchInput, setSearchInput, activeSearch, clearSearch } = useDebouncedSearch()
  const {
    data: infiniteData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isTeamsLoading,
    isFetching,
    isError,
  } = useInfiniteTeams(20, activeSearch)
  const rawTeams = React.useMemo(() => {
    if (!infiniteData?.pages) return []
    const seen = new Set<string>()
    const result: Array<{
      id: string
      name: string
      description: string | null
      members: string[] | null
      createdAt: string
      updatedAt: string
    }> = []
    for (const page of infiniteData.pages) {
      for (const item of (page as { data: typeof result }).data) {
        if (!seen.has(item.id)) {
          seen.add(item.id)
          result.push(item)
        }
      }
    }
    return result
  }, [infiniteData?.pages])

  const memberIds = React.useMemo(
    () => Array.from(new Set(rawTeams.flatMap((team) => team.members || []))),
    [rawTeams],
  )
  const { data: memberUsers = [], isLoading: isUsersLoading } = useUsersByIds(memberIds)
  const usersById = React.useMemo(
    () => new Map(memberUsers.map((user) => [user.id, user])),
    [memberUsers],
  )

  const teams: TeamWithUsers[] = React.useMemo(
    () =>
      rawTeams.map((team) => ({
        ...team,
        members: (team.members || [])
          .map((memberId) => usersById.get(memberId as string))
          .filter((u): u is import('@/modules/users').User => !!u),
      })),
    [rawTeams, usersById],
  )

  const isLoading = isTeamsLoading || isUsersLoading

  const createTeam = useCreateTeam()
  const updateTeam = useUpdateTeam()
  const deleteTeam = useDeleteTeam()
  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [editingTeamId, setEditingTeamId] = React.useState<string | null>(null)
  const [memberSearch, setMemberSearch] = React.useState('')
  const [formData, setFormData] = React.useState<TeamFormState>(initialFormState)

  // Infinite scroll sentinel
  const sentinelRef = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  const isEditing = !!editingTeamId
  const selectedTeam = React.useMemo(
    () => teams.find((team) => team.id === editingTeamId) ?? null,
    [teams, editingTeamId],
  )

  const normalizedMemberSearch = memberSearch.trim() || undefined
  const { data: directoryUsers = [], isLoading: isDirectoryLoading } = useUserDirectory(
    normalizedMemberSearch,
    normalizedMemberSearch ? 50 : 25,
  )
  const { data: selectedUsers = [], isLoading: isSelectedUsersLoading } = useUsersByIds(
    formData.members,
  )

  const filteredUsers = React.useMemo(() => {
    const usersById = new Map<string, (typeof directoryUsers)[number]>()

    for (const user of selectedUsers) {
      usersById.set(user.id, user)
    }

    for (const user of directoryUsers) {
      usersById.set(user.id, user)
    }

    return [...usersById.values()]
  }, [directoryUsers, selectedUsers])

  const resetForm = React.useCallback(() => {
    setFormData(initialFormState)
    setMemberSearch('')
    setEditingTeamId(null)
  }, [])

  const handleCreateOpen = () => {
    resetForm()
    setIsSheetOpen(true)
  }

  const handleEditOpen = (team: TeamWithUsers) => {
    setEditingTeamId(team.id)
    setMemberSearch('')
    setFormData({
      name: team.name,
      description: team.description ?? '',
      members: team.members.map((member) => member.id),
    })
    setIsSheetOpen(true)
  }

  const toggleMember = (userId: string) => {
    setFormData((prev) => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter((id) => id !== userId)
        : [...prev.members, userId],
    }))
  }

  const isSubmitting = createTeam.isPending || updateTeam.isPending

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formData.name.trim()) return

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      members: formData.members,
    }

    if (isEditing && selectedTeam) {
      await updateTeam.mutateAsync({
        id: selectedTeam.id,
        data: payload,
      })
    } else {
      await createTeam.mutateAsync(payload)
    }

    setIsSheetOpen(false)
    resetForm()
  }

  const handleDelete = (team: TeamWithUsers) => {
    toast.error(t('team.confirm.delete', { name: team.name }), {
      description: t('common.undoWarning'),
      action: {
        label: t('common.delete'),
        onClick: () => deleteTeam.mutate(team.id),
      },
      duration: 10000,
    })
  }

  const teamColumns = useTeamColumns(handleEditOpen, handleDelete)
  const totalCount = infiniteData?.pages[0]?.totalCount ?? 0
  const showSearchSpinner = isFetching && !isFetchingNextPage

  if (isLoading) {
    return <TableSkeleton rows={5} />
  }

  if (isError) {
    return <TableErrorState titleKey="team.error.title" descriptionKey="team.error.description" />
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">
            {t('team.title')}
            {totalCount > 0 && (
              <span className="ml-2 text-muted-foreground font-normal text-2xl">
                ({totalCount})
              </span>
            )}
          </h2>
          <p className="text-muted-foreground">
            {t('team.subtitle', 'Create and manage teams across your organization.')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg border border-border/60 p-0.5">
            <Button
              variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('cards')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={handleCreateOpen} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('team.actions.new', { defaultValue: 'New Team' })}
          </Button>
        </div>
      </div>

      <TableSearchBar
        searchInput={searchInput}
        onSearchChange={setSearchInput}
        onClear={clearSearch}
        loadedCount={teams.length}
        totalCount={totalCount}
        showSpinner={showSearchSpinner}
      />
      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center p-8 border-2 border-dashed rounded-lg">
          <IconUsers className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-medium">
            {t('team.empty.title', { defaultValue: 'No teams yet' })}
          </h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-6">
            {t('team.empty.description', {
              defaultValue: 'Create your first team and assign members from the organization.',
            })}
          </p>
          <Button onClick={handleCreateOpen} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            {t('team.actions.new', { defaultValue: 'New Team' })}
          </Button>
        </div>
      ) : viewMode === 'table' ? (
        <>
          <UnifiedDataTable
            columns={teamColumns}
            data={teams}
            enableGrouping
            groupableColumns={['memberCount']}
            enablePagination
            pageSizeOptions={[10, 20, 50]}
            initialPageSize={20}
            enableExport
            exportFileName="teams.csv"
            enableSelection={false}
            fullHeight
          />
          <div className="h-10 flex items-center justify-center shrink-0">
            {hasNextPage && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage
                  ? t('common.loading')
                  : t('common.loadMore', { defaultValue: 'Load more' })}
              </Button>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 content-start">
            {teams.map((team) => (
              <Card
                key={team.id}
                className="flex flex-col h-full hover:shadow-md transition-shadow"
              >
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
                  <div className="space-y-1.5 pr-2">
                    <CardTitle className="text-base font-semibold leading-tight">
                      {team.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {team.description || t('common.optional')}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => handleEditOpen(team)}
                    >
                      <IconEdit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(team)}
                    >
                      <IconTrash className="h-4 w-4" />
                    </Button>
                    <div className="h-8 w-8 flex items-center justify-center">
                      <IconUsers className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <h4 className="mb-4 text-sm font-medium text-muted-foreground">
                    {t('team.members', { defaultValue: 'Members' })}
                  </h4>
                  <div className="flex items-center justify-between pt-2 border-t border-border/40">
                    <div className="flex -space-x-2 overflow-hidden">
                      <TooltipProvider>
                        {team.members.slice(0, 5).map((member) => (
                          <Tooltip key={member.id}>
                            <TooltipTrigger asChild>
                              <Avatar className="inline-block h-7 w-7 rounded-full ring-2 ring-background">
                                <AvatarImage src={member.avatar || undefined} alt={member.name} />
                                <AvatarFallback className="text-[10px] bg-muted text-muted-foreground">
                                  {member.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="text-xs font-medium">{member.name}</p>
                              <p className="text-[10px] text-muted-foreground">{member.email}</p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                        {team.members.length > 5 && (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-muted text-[10px] font-medium ring-2 ring-background">
                            +{team.members.length - 5}
                          </div>
                        )}
                      </TooltipProvider>
                      {team.members.length === 0 && (
                        <span className="text-xs text-muted-foreground italic">
                          {t('team.emptyMembers', { defaultValue: 'No members assigned.' })}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <IconUsers className="h-3.5 w-3.5" />
                      <span>{team.members.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div ref={sentinelRef} className="h-10 flex items-center justify-center">
            {isFetchingNextPage && (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            )}
          </div>
        </div>
      )}

      <Sheet
        open={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open)
          if (!open) {
            resetForm()
          }
        }}
      >
        <CrudSheetContent>
          <CrudSheetHeader
            title={
              isEditing
                ? t('team.actions.edit', { defaultValue: 'Edit Team' })
                : t('team.actions.create', { defaultValue: 'Create Team' })
            }
            description={
              isEditing
                ? t('team.sheet.editDescription', {
                    defaultValue: 'Update team information and assigned members.',
                  })
                : t('team.sheet.createDescription', {
                    defaultValue: 'Create a team and choose the members.',
                  })
            }
            onClose={() => {
              setIsSheetOpen(false)
              resetForm()
            }}
          />

          <form onSubmit={handleSubmit} className="flex flex-col h-full min-h-0">
            <CrudSheetBody>
              <CrudSheetSection>
                <div className="space-y-2">
                  <label htmlFor="team-name" className="text-sm font-medium">
                    {t('team.fields.name', { defaultValue: 'Team name' })}
                  </label>
                  <Input
                    id="team-name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder={t('team.placeholders.name', {
                      defaultValue: 'e.g. Platform Team',
                    })}
                    className="bg-muted/20"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="team-description" className="text-sm font-medium">
                    {t('team.fields.description', { defaultValue: 'Description' })}
                  </label>
                  <Textarea
                    id="team-description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, description: e.target.value }))
                    }
                    rows={4}
                    placeholder={t('team.placeholders.description', {
                      defaultValue: 'Describe this team responsibilities...',
                    })}
                    className="bg-muted/20"
                  />
                </div>
              </CrudSheetSection>

              <CrudSheetSection>
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium">
                    {t('team.fields.members', { defaultValue: 'Members' })}
                  </h4>
                  <span className="text-xs text-muted-foreground">{formData.members.length}</span>
                </div>

                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="member-search"
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder={t('team.placeholders.membersSearch', {
                      defaultValue: 'Search users...',
                    })}
                    className="pl-8 bg-muted/20"
                  />
                </div>

                <div className="space-y-2 rounded-lg border p-3 max-h-80 overflow-y-auto">
                  {isDirectoryLoading || isSelectedUsersLoading ? (
                    <div className="text-sm text-muted-foreground py-4 text-center">
                      {t('common.loading', { defaultValue: 'Loading...' })}
                    </div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-sm text-muted-foreground py-4 text-center">
                      {t('team.emptyUsers', { defaultValue: 'No users available.' })}
                    </div>
                  ) : (
                    filteredUsers.map((user) => {
                      const checked = formData.members.includes(user.id)
                      return (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => toggleMember(user.id)}
                          className={cn(
                            'w-full text-left p-2 rounded-md border transition-colors',
                            checked
                              ? 'bg-primary/10 border-primary/40'
                              : 'border-transparent hover:bg-muted/40',
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatar || undefined} alt={user.name} />
                              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">{user.name}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {user.email}
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </CrudSheetSection>
            </CrudSheetBody>

            <CrudSheetActions className="grid-cols-2">
              <Button
                type="submit"
                disabled={isSubmitting || !formData.name.trim()}
                className="flex-1 shadow-md"
              >
                {isEditing ? t('common.save') : t('common.create')}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsSheetOpen(false)
                  resetForm()
                }}
              >
                {t('common.cancel')}
              </Button>
            </CrudSheetActions>
          </form>
        </CrudSheetContent>
      </Sheet>
    </div>
  )
}
