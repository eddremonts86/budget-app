import { Plus, Search, Trash2, UserPlus } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useUsers, useCreateUser } from '@/modules/users'
import { UserForm, type UserFormValues } from '@/modules/users'
import type { User } from '@/modules/users'
import {
  useProjectMembers,
  useAddProjectMember,
  useUpdateProjectMember,
  useRemoveProjectMember,
} from '../api/projects.queries'
import type { ProjectMemberRole, ProjectMember } from '../model/types'
import { PROJECT_MEMBER_ROLES } from '../model/types'

interface ProjectMembersListProps {
  projectId: string
}

export function ProjectMembersList({ projectId }: ProjectMembersListProps) {
  const { t } = useTranslation()
  const [searchTerm, setSearchTerm] = useState('')
  const [userSearchTerm, setUserSearchTerm] = useState('')
  const [isAddingMember, setIsAddingMember] = useState(false)
  const [isRegisteringUser, setIsRegisteringUser] = useState(false)

  const { data: members, isLoading: isLoadingMembers } = useProjectMembers(projectId)
  const { data: allUsers, isLoading: isLoadingUsers } = useUsers()

  const addMember = useAddProjectMember()
  const updateMember = useUpdateProjectMember()
  const removeMember = useRemoveProjectMember()
  const createUser = useCreateUser()

  const filteredMembers = useMemo(() => {
    if (!members) return []
    return (members as ProjectMember[]).filter(
      (member) =>
        member.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [members, searchTerm])

  const availableUsers = useMemo(() => {
    if (!allUsers || !members) return []
    const memberUserIds = new Set((members as ProjectMember[]).map((m) => m.userId))
    return (allUsers as User[])
      .filter((user) => !memberUserIds.has(user.id))
      .filter(
        (user) =>
          user.name.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(userSearchTerm.toLowerCase()),
      )
  }, [allUsers, members, userSearchTerm])

  const handleAddMember = (userId: string) => {
    addMember.mutate({
      projectId,
      userId,
      role: 'contributor',
    })
    setIsAddingMember(false)
  }

  const handleRegisterUser = async (values: UserFormValues) => {
    const newUser = await createUser.mutateAsync(values)
    if (newUser) {
      handleAddMember(newUser.id)
      setIsRegisteringUser(false)
    }
  }

  const handleUpdateRole = (userId: string, role: ProjectMemberRole) => {
    updateMember.mutate({
      projectId,
      userId,
      data: { role },
    })
  }

  const handleRemoveMember = (userId: string, userName: string) => {
    if (window.confirm(t('projects.members.removeConfirm', { name: userName }))) {
      removeMember.mutate({
        projectId,
        userId,
      })
    }
  }

  if (isLoadingMembers || isLoadingUsers) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-xl font-bold">{t('projects.members.title')}</CardTitle>
            <CardDescription>{t('projects.members.description')}</CardDescription>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={() => setIsRegisteringUser(true)}>
              <UserPlus className="mr-2 h-4 w-4" />
              {t('projects.members.register')}
            </Button>
            <DropdownMenu open={isAddingMember} onOpenChange={setIsAddingMember}>
              <DropdownMenuTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  {t('projects.members.add')}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[240px]">
                <div className="p-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('projects.members.searchUsers')}
                      className="pl-8"
                      autoFocus
                      value={userSearchTerm}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setUserSearchTerm(e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {availableUsers.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {t('projects.members.noAvailableUsers')}
                    </div>
                  ) : (
                    availableUsers.map((user: User) => (
                      <DropdownMenuItem
                        key={user.id}
                        onSelect={() => handleAddMember(user.id)}
                        className="flex items-center gap-2 p-2"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar || undefined} alt={user.name} />
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{user.name}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                            {user.email}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('projects.members.searchMembers')}
                className="pl-8"
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="divide-y divide-border">
              {filteredMembers.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {t('projects.members.empty')}
                </div>
              ) : (
                filteredMembers.map((member: ProjectMember) => (
                  <div key={member.id} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{member.userName?.charAt(0) || '?'}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium leading-none">{member.userName}</span>
                        <span className="text-xs text-muted-foreground">{member.userEmail}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={member.role}
                        onValueChange={(value) =>
                          handleUpdateRole(member.userId, value as ProjectMemberRole)
                        }
                      >
                        <SelectTrigger className="h-8 w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PROJECT_MEMBER_ROLES.map((role) => (
                            <SelectItem key={role} value={role}>
                              {t(`projects.roles.${role}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleRemoveMember(member.userId, member.userName)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      <Sheet open={isRegisteringUser} onOpenChange={setIsRegisteringUser}>
        <SheetContent className="sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle>{t('projects.members.register')}</SheetTitle>
            <SheetDescription>{t('projects.members.registerDescription')}</SheetDescription>
          </SheetHeader>
          <div className="mt-4">
            <UserForm
              onSubmit={handleRegisterUser}
              onCancel={() => setIsRegisteringUser(false)}
              isLoading={createUser.isPending}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
