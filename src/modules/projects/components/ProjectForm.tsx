import { useForm } from '@tanstack/react-form'
import { format } from 'date-fns'
import { da } from 'date-fns/locale/da'
import { enUS } from 'date-fns/locale/en-US'
import { es } from 'date-fns/locale/es'
import { Briefcase, Calendar, Code, Layout, Loader2, Plus, Save, Tag, Users } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import { FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { useDepartments, useSkills } from '@/modules/projects'
import { useCreateUser, useUserDirectory, useUsersByIds } from '@/modules/users'
import { UserForm } from '@/modules/users'
import { cn } from '@/shared/lib/utils'
import type { Project, ProjectMemberRole } from '../model/types'
import { PROJECT_MEMBER_ROLES } from '../model/types'

type TeamMember = {
  userId: string
  role: ProjectMemberRole
}

const projectFormSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  status: z.enum(['active', 'completed', 'on_hold', 'planning', 'cancelled']),
  type: z.enum(['internal', 'external', 'research', 'maintenance']),
  startDate: z.string().min(1),
  endDate: z.string().min(1),
  skills: z.array(z.string()).min(1),
  budget: z.number().min(0),
  priority: z.enum(['low', 'medium', 'high']),
  departmentId: z.string().optional(),
  team: z
    .array(
      z.object({
        userId: z.string(),
        role: z.enum(['owner', 'manager', 'contributor', 'viewer']),
      }),
    )
    .default([]),
})

export type ProjectFormValues = z.infer<typeof projectFormSchema>

type ProjectFormProps = {
  defaultValues?: Partial<Project>
  onSubmit: (values: ProjectFormValues) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function ProjectForm({ defaultValues, onSubmit, onCancel, isLoading }: ProjectFormProps) {
  const { t, i18n } = useTranslation()
  const { data: departments = [] } = useDepartments()
  const { data: availableSkills = [] } = useSkills()
  const createUser = useCreateUser()
  const [isUserSheetOpen, setIsUserSheetOpen] = React.useState(false)
  const [teamSearch, setTeamSearch] = React.useState('')

  const locale = React.useMemo(() => {
    const language = i18n.language?.toLowerCase() ?? 'en'
    const normalized = language.split('-')[0]
    if (normalized === 'es') return es
    if (normalized === 'dk' || normalized === 'da') return da
    return enUS
  }, [i18n.language])

  const initialValues = React.useMemo(() => {
    const now = new Date()
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    return {
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      status: (defaultValues?.status as ProjectFormValues['status']) ?? 'active',
      type: (defaultValues?.type as ProjectFormValues['type']) ?? 'internal',
      startDate: defaultValues?.startDate ?? now.toISOString().split('T')[0],
      endDate: defaultValues?.endDate ?? thirtyDaysLater.toISOString().split('T')[0],
      skills: defaultValues?.skills ?? [],
      budget: defaultValues?.budget ?? 0,
      priority: (defaultValues?.priority as ProjectFormValues['priority']) ?? 'medium',
      departmentId: defaultValues?.departmentId ?? undefined,
      team:
        (defaultValues?.team as unknown as ProjectFormValues['team']) ??
        ([] as ProjectFormValues['team']),
    }
  }, [defaultValues])

  const form = useForm({
    defaultValues: initialValues as ProjectFormValues,
    onSubmit: async ({ value }) => {
      const result = projectFormSchema.safeParse(value)
      if (!result.success) {
        // eslint-disable-next-line no-console
        console.error('Validation failed', result.error)
        return
      }
      await onSubmit(value)
    },
  })

  const [selectedTeamUserIds, setSelectedTeamUserIds] = React.useState<string[]>(
    initialValues.team.map((member) => member.userId),
  )
  const normalizedTeamSearch = teamSearch.trim() || undefined
  const { data: directoryUsers = [] } = useUserDirectory(
    normalizedTeamSearch,
    normalizedTeamSearch ? 50 : 25,
  )
  const { data: selectedUsers = [] } = useUsersByIds(selectedTeamUserIds)
  const teamUsers = React.useMemo(() => {
    const usersById = new Map<string, (typeof directoryUsers)[number]>()

    for (const user of selectedUsers) {
      usersById.set(user.id, user)
    }

    for (const user of directoryUsers) {
      usersById.set(user.id, user)
    }

    return [...usersById.values()]
  }, [directoryUsers, selectedUsers])
  const selectedUsersById = React.useMemo(
    () => new Map(selectedUsers.map((user) => [user.id, user])),
    [selectedUsers],
  )

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-6"
    >
      <form.Field name="name">
        {(field) => (
          <FieldGroup>
            <FieldLabel htmlFor={field.name} className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              {t('projects.form.nameLabel')}
            </FieldLabel>
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                field.handleChange(e.target.value)
              }
              placeholder={t('projects.form.namePlaceholder')}
              autoFocus
            />
            <FieldError
              errors={field.state.meta.errors.map((e) => {
                if (typeof e === 'string') return e
                if (e && typeof e === 'object' && 'message' in e)
                  return String((e as { message: string }).message)
                return String(e)
              })}
            />
          </FieldGroup>
        )}
      </form.Field>

      <form.Field name="description">
        {(field) => (
          <FieldGroup>
            <FieldLabel htmlFor={field.name} className="flex items-center gap-2">
              <Layout className="h-4 w-4" />
              {t('projects.form.descriptionLabel')}
            </FieldLabel>
            <Textarea
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                field.handleChange(e.target.value)
              }
              placeholder={t('projects.form.descriptionPlaceholder')}
              rows={3}
            />
            <FieldError
              errors={field.state.meta.errors.map((e) => {
                if (typeof e === 'string') return e
                if (e && typeof e === 'object' && 'message' in e)
                  return String((e as { message: string }).message)
                return String(e)
              })}
            />
          </FieldGroup>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="type">
          {(field) => (
            <FieldGroup>
              <FieldLabel className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                {t('projects.form.typeLabel')}
              </FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(value) => field.handleChange(value as ProjectFormValues['type'])}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('projects.form.typePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="internal">{t('projects.type.internal')}</SelectItem>
                  <SelectItem value="external">{t('projects.type.external')}</SelectItem>
                  <SelectItem value="research">{t('projects.type.research')}</SelectItem>
                  <SelectItem value="maintenance">{t('projects.type.maintenance')}</SelectItem>
                </SelectContent>
              </Select>
            </FieldGroup>
          )}
        </form.Field>

        <form.Field name="departmentId">
          {(field) => (
            <FieldGroup>
              <FieldLabel className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t('projects.form.departmentLabel')}
              </FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(value: string) => field.handleChange(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('projects.form.departmentPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {departments.map((dept: { id: string; name: string }) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldGroup>
          )}
        </form.Field>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <form.Field name="status">
          {(field) => (
            <FieldGroup>
              <FieldLabel className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                {t('projects.form.statusLabel')}
              </FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(value: string) =>
                  field.handleChange(value as ProjectFormValues['status'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('projects.form.statusPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t('projects.status.active')}</SelectItem>
                  <SelectItem value="completed">{t('projects.status.completed')}</SelectItem>
                  <SelectItem value="on_hold">{t('projects.status.on_hold')}</SelectItem>
                  <SelectItem value="planning">{t('projects.status.planning')}</SelectItem>
                  <SelectItem value="cancelled">{t('projects.status.cancelled')}</SelectItem>
                </SelectContent>
              </Select>
            </FieldGroup>
          )}
        </form.Field>

        <form.Field name="priority">
          {(field) => (
            <FieldGroup>
              <FieldLabel className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                {t('projects.form.priorityLabel')}
              </FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(value: string) =>
                  field.handleChange(value as ProjectFormValues['priority'])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('projects.form.priorityPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('projects.priority.low')}</SelectItem>
                  <SelectItem value="medium">{t('projects.priority.medium')}</SelectItem>
                  <SelectItem value="high">{t('projects.priority.high')}</SelectItem>
                </SelectContent>
              </Select>
            </FieldGroup>
          )}
        </form.Field>

        <form.Field name="budget">
          {(field) => (
            <FieldGroup>
              <FieldLabel htmlFor={field.name} className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                {t('projects.form.budgetLabel')}
              </FieldLabel>
              <Input
                type="number"
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  field.handleChange(Number(e.target.value))
                }
                placeholder={t('projects.form.budgetPlaceholder')}
              />
              <FieldError
                errors={field.state.meta.errors.map((e) => {
                  if (typeof e === 'string') return e
                  if (e && typeof e === 'object' && 'message' in e)
                    return String((e as { message: string }).message)
                  return String(e)
                })}
              />
            </FieldGroup>
          )}
        </form.Field>
      </div>

      {!defaultValues?.id && (
        <form.Field name="team">
          {(field) => {
            const selectedUserIds = field.state.value.map((m: TeamMember) => m.userId)

            return (
              <FieldGroup>
                <FieldLabel className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t('projects.form.teamLabel')}
                </FieldLabel>
                <Combobox
                  multiple
                  value={selectedUserIds}
                  onValueChange={(newIds: string[]) => {
                    setSelectedTeamUserIds(newIds)
                    const currentTeam = [...field.state.value]
                    const updatedTeam = newIds.map((id: string) => {
                      const existing = currentTeam.find((m: TeamMember) => m.userId === id)
                      return existing || { userId: id, role: 'contributor' as const }
                    })
                    field.handleChange(updatedTeam)
                  }}
                >
                  <ComboboxChips>
                    {field.state.value.map((member: TeamMember) => {
                      const user = selectedUsersById.get(member.userId)
                      return (
                        <ComboboxChip key={member.userId}>
                          <div className="flex items-center gap-2">
                            <span>{user?.name || member.userId}</span>
                            <span className="text-[10px] uppercase opacity-50">
                              ({member.role})
                            </span>
                          </div>
                        </ComboboxChip>
                      )
                    })}
                    <ComboboxChipsInput
                      placeholder={t('projects.form.teamPlaceholder')}
                      value={teamSearch}
                      onChange={(event) => setTeamSearch(event.target.value)}
                    />
                  </ComboboxChips>
                  <ComboboxContent>
                    <ComboboxEmpty className="p-4 text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        {t('projects.form.teamEmpty')}
                      </p>
                      <Sheet open={isUserSheetOpen} onOpenChange={setIsUserSheetOpen}>
                        <SheetTrigger asChild>
                          <Button variant="outline" size="sm" className="w-full">
                            <Plus className="mr-2 h-4 w-4" />
                            {t('projects.form.addNewUser')}
                          </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="sm:max-w-135">
                          <SheetHeader className="mb-6">
                            <SheetTitle>{t('users.create')}</SheetTitle>
                          </SheetHeader>
                          <UserForm
                            onSubmit={async (values) => {
                              await createUser.mutateAsync(values)
                              setIsUserSheetOpen(false)
                            }}
                            onCancel={() => setIsUserSheetOpen(false)}
                            isLoading={createUser.isPending}
                          />
                        </SheetContent>
                      </Sheet>
                    </ComboboxEmpty>
                    <ComboboxList>
                      {teamUsers.map((user: { id: string; name: string; email: string }) => (
                        <ComboboxItem key={user.id} value={user.id}>
                          <div className="flex flex-col">
                            <span className="font-medium">{user.name}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                          </div>
                        </ComboboxItem>
                      ))}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>

                <div className="mt-4 space-y-2">
                  {field.state.value.map((member: TeamMember, index: number) => {
                    const user = selectedUsersById.get(member.userId)
                    if (!user) return null

                    return (
                      <div
                        key={member.userId}
                        className="flex items-center justify-between p-2 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-center gap-3 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                        <Select
                          value={member.role}
                          onValueChange={(role: TeamMember['role']) => {
                            const updatedTeam = [...field.state.value]
                            updatedTeam[index] = { ...member, role }
                            field.handleChange(updatedTeam)
                          }}
                        >
                          <SelectTrigger className="w-35 h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PROJECT_MEMBER_ROLES.map((r) => (
                              <SelectItem key={r} value={r} className="text-xs">
                                {t(`projects.roles.${r}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )
                  })}
                </div>
                <FieldError
                  errors={field.state.meta.errors.map((e) => {
                    if (typeof e === 'string') return e
                    if (e && typeof e === 'object' && 'message' in e)
                      return String((e as { message: string }).message)
                    return String(e)
                  })}
                />
              </FieldGroup>
            )
          }}
        </form.Field>
      )}

      <div className="grid grid-cols-2 gap-4">
        <form.Field name="startDate">
          {(field) => (
            <FieldGroup>
              <FieldLabel className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('projects.form.startDateLabel')}
              </FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !field.state.value && 'text-muted-foreground',
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {field.state.value ? (
                      format(new Date(field.state.value), 'PPP', { locale })
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={field.state.value ? new Date(field.state.value) : undefined}
                    onSelect={(date: Date | undefined) => {
                      if (date) {
                        field.handleChange(date.toISOString().split('T')[0])
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FieldError
                errors={field.state.meta.errors.map((e) => {
                  if (typeof e === 'string') return e
                  if (e && typeof e === 'object' && 'message' in e)
                    return String((e as { message: string }).message)
                  return String(e)
                })}
              />
            </FieldGroup>
          )}
        </form.Field>

        <form.Field name="endDate">
          {(field) => (
            <FieldGroup>
              <FieldLabel className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t('projects.form.endDateLabel')}
              </FieldLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !field.state.value && 'text-muted-foreground',
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {field.state.value ? (
                      format(new Date(field.state.value), 'PPP', { locale })
                    ) : (
                      <span>{t('projects.form.endDatePlaceholder')}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={field.state.value ? new Date(field.state.value) : undefined}
                    onSelect={(date: Date | undefined) => {
                      if (date) {
                        field.handleChange(date.toISOString().split('T')[0])
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FieldError
                errors={field.state.meta.errors.map((e) => {
                  if (typeof e === 'string') return e
                  if (e && typeof e === 'object' && 'message' in e)
                    return String((e as { message: string }).message)
                  return String(e)
                })}
              />
            </FieldGroup>
          )}
        </form.Field>
      </div>

      <form.Field name="skills">
        {(field) => (
          <FieldGroup>
            <FieldLabel htmlFor={field.name} className="flex items-center gap-2">
              <Code className="h-4 w-4" />
              {t('projects.form.skillsLabel')}
            </FieldLabel>
            <Combobox
              multiple
              value={field.state.value}
              onValueChange={(value) => field.handleChange(value)}
            >
              <ComboboxChips>
                {field.state.value.map((skill) => (
                  <ComboboxChip key={skill}>{skill}</ComboboxChip>
                ))}
                <ComboboxChipsInput placeholder={t('projects.form.skillsPlaceholder')} />
              </ComboboxChips>
              <ComboboxContent>
                <ComboboxEmpty>{t('projects.form.skillsEmpty')}</ComboboxEmpty>
                <ComboboxList>
                  {availableSkills.map((skill) => (
                    <ComboboxItem key={skill.id} value={skill.name}>
                      {skill.name}
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
            <FieldError
              errors={field.state.meta.errors.map((e) => {
                if (typeof e === 'string') return e
                if (e && typeof e === 'object' && 'message' in e)
                  return String((e as { message: string }).message)
                return String(e)
              })}
            />
          </FieldGroup>
        )}
      </form.Field>

      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-border/40">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {t('common.save')}
        </Button>
      </div>
    </form>
  )
}
