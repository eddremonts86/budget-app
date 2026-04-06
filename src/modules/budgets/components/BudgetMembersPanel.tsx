import { UserPlus, Trash2 } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  CrudSheetActions,
  CrudSheetBody,
  CrudSheetContent,
  CrudSheetHeader,
  CrudSheetSection,
} from '@/components/ui/crud-sheet'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { useCurrentUser, useUserDirectory } from '@/modules/users'
import {
  useBudgetMembers,
  useAddBudgetMember,
  useUpdateBudgetMemberRole,
  useRemoveBudgetMember,
} from '../api/budget-members.queries'
import type { BudgetMemberRole } from '../model/types'

interface BudgetMembersPanelProps {
  budgetId: string
  ownerId: string
}

const ROLE_COLORS: Record<BudgetMemberRole, string> = {
  admin: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300',
  contributor: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
  viewer: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
}

export function BudgetMembersPanel({ budgetId, ownerId }: BudgetMembersPanelProps) {
  const { t } = useTranslation()
  const { syncedUserId: currentUserId, roleKey } = useCurrentUser()
  const { data: members, isLoading } = useBudgetMembers(budgetId)
  const addMutation = useAddBudgetMember(budgetId)
  const roleMutation = useUpdateBudgetMemberRole(budgetId)
  const removeMutation = useRemoveBudgetMember(budgetId)

  const [dialogOpen, setDialogOpen] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [selectedUserId, setSelectedUserId] = React.useState('')
  const [selectedRole, setSelectedRole] = React.useState<BudgetMemberRole>('contributor')
  const { data: userDirectory = [] } = useUserDirectory(search || undefined, 20)

  const isOwner = currentUserId === ownerId || roleKey === 'admin'
  const memberIds = React.useMemo(() => new Set((members ?? []).map((m) => m.userId)), [members])
  const availableUsers = userDirectory.filter((u) => !memberIds.has(u.id))

  async function handleAdd() {
    if (!selectedUserId) return
    await addMutation.mutateAsync({ budgetId, userId: selectedUserId, role: selectedRole })
    setDialogOpen(false)
    setSelectedUserId('')
    setSearch('')
    setSelectedRole('contributor')
  }

  function getInitials(name?: string | null) {
    if (!name) return '?'
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {members?.length ?? 0} {t('budgets.members.count')}
        </p>
        {isOwner && (
          <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
            <UserPlus className="size-4 mr-1" />
            {t('budgets.members.add')}
          </Button>
        )}
      </div>

      {!members?.length ? (
        <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
          {t('budgets.members.empty')}
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.userId}
              className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
            >
              <Avatar className="size-9">
                <AvatarImage src={member.userAvatar ?? undefined} />
                <AvatarFallback>{getInitials(member.userName)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{member.userName ?? member.userId}</p>
                {member.userEmail && (
                  <p className="text-xs text-muted-foreground truncate">{member.userEmail}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {member.userId === ownerId ? (
                  <Badge variant="outline">{t('budgets.members.owner')}</Badge>
                ) : isOwner ? (
                  <Select
                    value={member.role}
                    onValueChange={(v) =>
                      roleMutation.mutate({
                        budgetId,
                        userId: member.userId,
                        role: v as BudgetMemberRole,
                      })
                    }
                  >
                    <SelectTrigger className="h-7 text-xs w-28">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">{t('budgets.roles.admin')}</SelectItem>
                      <SelectItem value="contributor">{t('budgets.roles.contributor')}</SelectItem>
                      <SelectItem value="viewer">{t('budgets.roles.viewer')}</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${ROLE_COLORS[member.role]}`}
                  >
                    {t(`budgets.roles.${member.role}`)}
                  </span>
                )}
                {isOwner && member.userId !== ownerId && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 text-destructive"
                    onClick={() => removeMutation.mutate({ budgetId, userId: member.userId })}
                    disabled={removeMutation.isPending}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={dialogOpen} onOpenChange={setDialogOpen}>
        <CrudSheetContent>
          <CrudSheetHeader
            title={t('budgets.members.addTitle')}
            onClose={() => setDialogOpen(false)}
            showPing={false}
          />

          <CrudSheetBody>
            <CrudSheetSection>
              <div className="space-y-1">
                <Label>{t('budgets.members.searchUser')}</Label>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('budgets.members.searchPlaceholder')}
                />
              </div>

              {availableUsers.length > 0 && (
                <div className="space-y-1">
                  <Label>{t('budgets.members.selectUser')}</Label>
                  <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('budgets.members.userPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name ?? u.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-1">
                <Label>{t('budgets.members.role')}</Label>
                <Select
                  value={selectedRole}
                  onValueChange={(v) => setSelectedRole(v as BudgetMemberRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">{t('budgets.roles.admin')}</SelectItem>
                    <SelectItem value="contributor">{t('budgets.roles.contributor')}</SelectItem>
                    <SelectItem value="viewer">{t('budgets.roles.viewer')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CrudSheetSection>
          </CrudSheetBody>

          <CrudSheetActions>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button disabled={!selectedUserId || addMutation.isPending} onClick={handleAdd}>
              {addMutation.isPending ? t('common.saving') : t('budgets.members.addBtn')}
            </Button>
          </CrudSheetActions>
        </CrudSheetContent>
      </Sheet>
    </div>
  )
}
