import { useForm, useStore } from '@tanstack/react-form'
import { format } from 'date-fns'
import { da, enUS, es } from 'date-fns/locale'
import { m } from 'framer-motion'
import {
  Calendar,
  ChevronDown,
  Clock,
  Flag,
  Folder,
  Layers,
  LayoutList,
  Loader2,
  MoreHorizontal,
  Save,
  Target,
  UserCircle,
  X,
} from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { useDebounce } from '@uidotdev/usehooks'
import { z } from 'zod'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Combobox,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
  ComboboxChips,
  ComboboxChip,
  ComboboxChipsInput,
} from '@/components/ui/combobox'
import { Field, FieldLabel, FieldError, FieldGroup } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Project } from '@/modules/projects'
import { useProjectMembers, useInfiniteProjects } from '@/modules/projects'
import { useInfiniteUsers } from '@/modules/users'
import type { User } from '@/modules/users'
import { cn } from '@/shared/lib/utils'
import { InfiniteSelect, type InfiniteSelectOption } from '@/shared/ui/InfiniteSelect'
import { useSearchTodos, useTodos } from '../api/todos.queries'
import type { Todo } from '../model/types'

const createTodoSchema = (t: (key: string) => string) =>
  z.object({
    title: z.string().min(1, t('validation.required')),
    description: z.string().min(1, t('validation.required')),
    status: z.enum([
      'pending',
      'in_progress',
      'testing',
      'on_hold',
      'completed',
      'blocked',
      'cancelled',
    ]),
    priority: z.enum(['low', 'medium', 'high']),
    dueDate: z.string().min(1, t('validation.required')),
    assignedTo: z.string().min(1, t('validation.required')),
    projectId: z.string().min(1, t('validation.required')),
    complexity: z.number().min(1).max(10).nullish(),
    estimatedTime: z.number().min(0).nullish(),
    actualTime: z.number().min(0).nullish(),
    acceptanceCriteria: z.string().nullish(),
    dependencies: z.array(z.string()).default([]),
  })

type TodoFormValues = z.infer<ReturnType<typeof createTodoSchema>>

type TodoFormProps = {
  defaultValues?: Partial<Todo>
  currentUserId?: string
  onSubmit: (values: TodoFormValues) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function TodoForm({
  defaultValues,
  currentUserId,
  onSubmit,
  onCancel,
  isLoading,
}: TodoFormProps) {
  const { t, i18n } = useTranslation()
  const todoSchema = React.useMemo(() => createTodoSchema(t), [t])

  // --- Form (declared early so we can subscribe to projectId) ---
  const form = useForm({
    defaultValues: {
      title: defaultValues?.title ?? '',
      description: defaultValues?.description ?? '',
      status: (defaultValues?.status as TodoFormValues['status']) ?? 'pending',
      priority: (defaultValues?.priority as TodoFormValues['priority']) ?? 'medium',
      dueDate: defaultValues?.dueDate ?? new Date().toISOString().split('T')[0],
      assignedTo: defaultValues?.assignedTo ?? currentUserId ?? '',
      projectId: defaultValues?.projectId ?? '',
      complexity: defaultValues?.complexity ?? null,
      estimatedTime: defaultValues?.estimatedTime ?? null,
      actualTime: defaultValues?.actualTime ?? null,
      acceptanceCriteria: defaultValues?.acceptanceCriteria ?? '',
      dependencies: defaultValues?.dependencies ?? [],
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  })

  // Subscribe to projectId so we can filter users server-side
  const selectedProjectId = useStore(form.store, (state) => state.values.projectId)

  // --- Project search + infinite query ---
  const [projectSearch, setProjectSearch] = React.useState<string | undefined>()
  const {
    data: infiniteProjects,
    fetchNextPage: fetchNextProjects,
    hasNextPage: hasNextProjects,
    isFetchingNextPage: isFetchingNextProjects,
    isLoading: isLoadingProjects,
  } = useInfiniteProjects(20, projectSearch, 'active')

  // --- User search + infinite query (filtered by selected project) ---
  const [userSearch, setUserSearch] = React.useState<string | undefined>()
  const {
    data: infiniteUsers,
    fetchNextPage: fetchNextUsers,
    hasNextPage: hasNextUsers,
    isFetchingNextPage: isFetchingNextUsers,
    isLoading: isLoadingUsers,
  } = useInfiniteUsers(20, userSearch, {
    projectId: selectedProjectId || undefined,
  })

  // --- Dependencies search ---
  const [rawDepsInput, setRawDepsInput] = React.useState('')
  const debouncedDepsInput = useDebounce(rawDepsInput, 300)
  const depsSearch = debouncedDepsInput.length >= 2 ? debouncedDepsInput : undefined
  const { data: searchedTodosData } = useSearchTodos(depsSearch, 20)
  const { data: initialTodosData } = useTodos({ limit: 50 })

  const availableTodos: Todo[] = React.useMemo(() => {
    if (depsSearch && searchedTodosData?.data) {
      return searchedTodosData.data as Todo[]
    }
    return (initialTodosData?.data as Todo[]) ?? []
  }, [depsSearch, searchedTodosData, initialTodosData])

  const projects = React.useMemo(
    () => (infiniteProjects?.pages.flatMap((page) => page.data) as Project[]) ?? [],
    [infiniteProjects],
  )
  const users = React.useMemo(
    () => (infiniteUsers?.pages.flatMap((page) => page.data) as User[]) ?? [],
    [infiniteUsers],
  )

  // --- InfiniteSelect options ---
  const projectOptions: InfiniteSelectOption<Project>[] = React.useMemo(
    () => projects.map((p) => ({ value: p.id, label: p.name, data: p })),
    [projects],
  )

  const userOptions: InfiniteSelectOption<User>[] = React.useMemo(
    () => users.map((u) => ({ value: u.id, label: u.name, data: u })),
    [users],
  )

  const locale = React.useMemo(() => {
    const language = i18n.language?.toLowerCase() ?? 'en'
    const normalized = language.split('-')[0]
    if (normalized === 'es') return es
    if (normalized === 'dk' || normalized === 'da') return da
    return enUS
  }, [i18n.language])

  // Check project membership for "Me" pinned option
  const { data: projectMembersData } = useProjectMembers(selectedProjectId)
  const isMeAMember = React.useMemo(() => {
    if (!currentUserId || !selectedProjectId) return false
    return projectMembersData?.some((m) => m.userId === currentUserId) ?? false
  }, [currentUserId, selectedProjectId, projectMembersData])

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 },
  }

  return (
    <m.form
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      onSubmit={(e: React.FormEvent) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="flex flex-col gap-8 min-h-full"
    >
      <div className="flex-1 space-y-8 pb-32">
        <FieldGroup className="bg-secondary/30 rounded-xl p-6">
          {/* 1. Title */}
          <form.Field
            name="title"
            validators={{
              onChange: todoSchema.shape.title,
            }}
          >
            {(field) => (
              <m.div variants={itemVariants}>
                <Field className="space-y-2">
                  <FieldLabel
                    htmlFor={field.name}
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80"
                  >
                    {t('todos.form.titleLabel')}
                  </FieldLabel>
                  <div className="relative group">
                    <Input
                      id={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        field.handleChange(e.target.value)
                      }
                      placeholder={t('todos.form.titlePlaceholder')}
                      className="h-10 bg-secondary/30 border-transparent hover:border-primary/30 focus:border-primary transition-all duration-300 rounded-lg px-4 text-sm"
                      aria-label={t('todos.form.titleLabel')}
                    />
                    <div className="absolute inset-0 rounded-lg bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </div>
                  <FieldError
                    errors={field.state.meta.errors.map((e) => {
                      if (typeof e === 'string') return e
                      if (e && typeof e === 'object' && 'message' in e)
                        return String((e as { message: string }).message)
                      return String(e)
                    })}
                    className="text-xs font-medium"
                  />
                </Field>
              </m.div>
            )}
          </form.Field>

          {/* 2. Description */}
          <form.Field name="description">
            {(field) => (
              <m.div variants={itemVariants}>
                <Field className="space-y-2">
                  <FieldLabel
                    htmlFor={field.name}
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80"
                  >
                    {t('todos.form.descriptionLabel')}
                  </FieldLabel>
                  <Textarea
                    id={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      field.handleChange(e.target.value)
                    }
                    placeholder={t('todos.form.descriptionPlaceholder')}
                    className="min-h-[120px] bg-secondary/30 border-transparent hover:border-primary/30 focus:border-primary transition-all duration-300 rounded-lg p-4 resize-none text-sm"
                  />
                  <FieldError
                    errors={field.state.meta.errors.map((e) => {
                      if (typeof e === 'string') return e
                      if (e && typeof e === 'object' && 'message' in e)
                        return String((e as { message: string }).message)
                      return String(e)
                    })}
                  />
                </Field>
              </m.div>
            )}
          </form.Field>

          {/* 3. Acceptance Criteria */}
          <form.Field name="acceptanceCriteria">
            {(field) => (
              <m.div variants={itemVariants}>
                <Field className="space-y-2">
                  <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                    <Target className="w-3.5 h-3.5" /> {t('todos.form.acceptanceCriteriaLabel')}
                  </FieldLabel>
                  <Textarea
                    value={field.state.value ?? ''}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder={t('todos.form.acceptanceCriteriaPlaceholder')}
                    className="min-h-[80px] bg-secondary/30 border-transparent hover:border-primary/30 transition-all rounded-lg p-4 resize-none text-sm"
                  />
                  <FieldError
                    errors={field.state.meta.errors.map((e) => {
                      if (typeof e === 'string') return e
                      if (e && typeof e === 'object' && 'message' in e)
                        return String((e as { message: string }).message)
                      return String(e)
                    })}
                  />
                </Field>
              </m.div>
            )}
          </form.Field>

          {/* 4. Due Date */}
          <form.Field name="dueDate">
            {(field) => (
              <m.div variants={itemVariants}>
                <Field className="space-y-2">
                  <FieldLabel
                    htmlFor={field.name}
                    className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2"
                  >
                    <Calendar className="w-3.5 h-3.5" /> {t('todos.form.dueDateLabel')}
                  </FieldLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'h-10 w-full justify-start text-left font-normal bg-secondary/30 border-transparent hover:border-primary/30 rounded-lg px-4 text-sm transition-all duration-300',
                          !field.state.value && 'text-muted-foreground',
                        )}
                      >
                        <Calendar className="h-4 w-4 opacity-50" />
                        {field.state.value ? (
                          format(
                            new Date(
                              field.state.value.includes('T')
                                ? field.state.value
                                : `${field.state.value}T00:00:00`,
                            ),
                            'PPP HH:mm',
                            { locale },
                          )
                        ) : (
                          <span>{t('todos.form.dueDatePlaceholder')}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 rounded-lg border-border/40 shadow-2xl flex"
                      align="start"
                    >
                      <div className="flex divide-x divide-border/40">
                        <CalendarComponent
                          mode="single"
                          selected={
                            field.state.value
                              ? new Date(
                                  field.state.value.includes('T')
                                    ? field.state.value
                                    : `${field.state.value}T00:00:00`,
                                )
                              : undefined
                          }
                          onSelect={(date) => {
                            if (!date) return
                            const year = date.getFullYear()
                            const month = String(date.getMonth() + 1).padStart(2, '0')
                            const day = String(date.getDate()).padStart(2, '0')
                            const currentTime = field.state.value?.includes('T')
                              ? field.state.value.split('T')[1]
                              : '00:00:00'
                            field.handleChange(`${year}-${month}-${day}T${currentTime}`)
                          }}
                          initialFocus
                          locale={locale}
                          className="rounded-l-lg"
                        />
                        <div className="flex flex-col max-h-[350px] overflow-y-auto p-1 scrollbar-hide w-[120px]">
                          <div className="p-2 text-xs font-bold uppercase tracking-widest text-muted-foreground/50 text-center border-b border-border/40 mb-1">
                            {t('common.time', 'Time')}
                          </div>
                          {Array.from({ length: 24 * 4 }).map((_, i) => {
                            const hour = Math.floor(i / 4)
                            const minute = (i % 4) * 15
                            const timeStr = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
                            const isSelected = field.state.value?.includes(`T${timeStr}`)

                            return (
                              <Button
                                key={timeStr}
                                variant="ghost"
                                className={cn(
                                  'justify-center font-medium h-9 px-3 rounded-lg text-sm transition-all',
                                  isSelected
                                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                    : 'hover:bg-primary/10 hover:text-primary',
                                )}
                                onClick={() => {
                                  const datePart =
                                    field.state.value?.split('T')[0] ||
                                    new Date().toISOString().split('T')[0]
                                  field.handleChange(`${datePart}T${timeStr}:00`)
                                }}
                              >
                                {timeStr}
                              </Button>
                            )
                          })}
                        </div>
                      </div>
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
                </Field>
              </m.div>
            )}
          </form.Field>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <form.Field name="projectId">
              {(field) => (
                <m.div variants={itemVariants}>
                  <Field className="space-y-2">
                    <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                      <Folder className="w-3.5 h-3.5" /> {t('todos.form.projectLabel')}
                    </FieldLabel>
                    <InfiniteSelect<Project>
                      value={field.state.value || undefined}
                      onValueChange={(value) => {
                        field.handleChange(value ?? '')
                        form.setFieldValue('assignedTo', '')
                      }}
                      options={projectOptions}
                      hasNextPage={hasNextProjects}
                      fetchNextPage={fetchNextProjects}
                      isFetchingNextPage={isFetchingNextProjects}
                      isLoading={isLoadingProjects}
                      onSearchChange={setProjectSearch}
                      searchPlaceholder={t('todos.form.searchProjects', 'Search projects…')}
                      placeholder={t('todos.form.projectPlaceholder')}
                      icon={<Folder className="h-3.5 w-3.5" />}
                      triggerClassName="h-10 w-full rounded-lg bg-secondary/30 border-transparent hover:border-primary/30 text-sm px-4 justify-start"
                      contentClassName="w-[var(--radix-popover-trigger-width)]"
                    />
                    <FieldError
                      errors={field.state.meta.errors.map((e) => {
                        if (typeof e === 'string') return e
                        if (e && typeof e === 'object' && 'message' in e)
                          return String((e as { message: string }).message)
                        return String(e)
                      })}
                    />
                  </Field>
                </m.div>
              )}
            </form.Field>

            <form.Field name="assignedTo">
              {(field) => (
                <m.div variants={itemVariants}>
                  <Field className="space-y-2">
                    <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                      <UserCircle className="w-3.5 h-3.5" /> {t('todos.form.assignedToLabel')}
                    </FieldLabel>
                    <InfiniteSelect<User>
                      value={field.state.value || undefined}
                      onValueChange={(value) => field.handleChange(value ?? '')}
                      options={userOptions}
                      hasNextPage={hasNextUsers}
                      fetchNextPage={fetchNextUsers}
                      isFetchingNextPage={isFetchingNextUsers}
                      isLoading={isLoadingUsers}
                      onSearchChange={setUserSearch}
                      searchPlaceholder={t('todos.filters.searchUsers', 'Search users…')}
                      placeholder={
                        !selectedProjectId
                          ? t('todos.form.selectProjectFirst', 'Select a project first')
                          : t('todos.form.assignedToPlaceholder')
                      }
                      icon={<UserCircle className="h-3.5 w-3.5" />}
                      disabled={!selectedProjectId}
                      pinnedOptions={
                        currentUserId && isMeAMember
                          ? [
                              {
                                value: currentUserId,
                                label: t('todos.form.assignedToSelf', 'Me'),
                              },
                            ]
                          : undefined
                      }
                      renderOption={(opt) => (
                        <span className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage
                              src={(opt.data as User)?.avatar || undefined}
                              alt={opt.label}
                            />
                            <AvatarFallback className="text-[10px]">
                              {opt.label.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {opt.label}
                        </span>
                      )}
                      renderValue={(opt) => (
                        <span className="flex items-center gap-2">
                          <Avatar className="h-5 w-5">
                            <AvatarImage
                              src={(opt.data as User)?.avatar || undefined}
                              alt={opt.label}
                            />
                            <AvatarFallback className="text-[10px]">
                              {opt.label.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {opt.label}
                        </span>
                      )}
                      triggerClassName="h-10 w-full rounded-lg bg-secondary/30 border-transparent hover:border-primary/30 text-sm px-4 justify-start"
                      contentClassName="w-[var(--radix-popover-trigger-width)]"
                    />
                    <FieldError
                      errors={field.state.meta.errors.map((e) => {
                        if (typeof e === 'string') return e
                        if (e && typeof e === 'object' && 'message' in e)
                          return String((e as { message: string }).message)
                        return String(e)
                      })}
                    />
                  </Field>
                </m.div>
              )}
            </form.Field>
          </div>

          {/* 6. Status, Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <form.Field name="status">
              {(field) => (
                <m.div variants={itemVariants}>
                  <Field className="space-y-2">
                    <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                      <MoreHorizontal className="w-3.5 h-3.5" /> {t('todos.form.statusLabel')}
                    </FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(value as TodoFormValues['status'])
                      }
                    >
                      <SelectTrigger className="h-10 w-full bg-secondary/30 border-transparent hover:border-primary/30 transition-all rounded-lg text-sm px-4">
                        <SelectValue placeholder={t('todos.form.statusPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-border/50 shadow-2xl backdrop-blur-xl">
                        <SelectItem value="pending" className="rounded-lg m-1">
                          {t('todos.form.statusPending')}
                        </SelectItem>
                        <SelectItem value="in_progress" className="rounded-lg m-1">
                          {t('todos.form.statusInProgress')}
                        </SelectItem>
                        <SelectItem value="testing" className="rounded-lg m-1">
                          {t('todos.form.statusTesting', 'Testing')}
                        </SelectItem>
                        <SelectItem value="on_hold" className="rounded-lg m-1">
                          {t('todos.form.statusOnHold', 'On Hold')}
                        </SelectItem>
                        <SelectItem value="blocked" className="rounded-lg m-1">
                          {t('todos.form.statusBlocked', 'Blocked')}
                        </SelectItem>
                        <SelectItem value="cancelled" className="rounded-lg m-1">
                          {t('todos.form.statusCancelled', 'Cancelled')}
                        </SelectItem>
                        <SelectItem value="completed" className="rounded-lg m-1">
                          {t('todos.form.statusCompleted')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError
                      errors={field.state.meta.errors.map((e) => {
                        if (typeof e === 'string') return e
                        if (e && typeof e === 'object' && 'message' in e)
                          return String((e as { message: string }).message)
                        return String(e)
                      })}
                    />
                  </Field>
                </m.div>
              )}
            </form.Field>

            <form.Field name="priority">
              {(field) => (
                <m.div variants={itemVariants}>
                  <Field className="space-y-2">
                    <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                      <Flag className="w-3.5 h-3.5" /> {t('todos.form.priorityLabel')}
                    </FieldLabel>
                    <Select
                      value={field.state.value}
                      onValueChange={(value) =>
                        field.handleChange(value as TodoFormValues['priority'])
                      }
                    >
                      <SelectTrigger
                        className={cn(
                          'h-10 w-full bg-secondary/30 border-transparent hover:border-primary/30 transition-all rounded-lg text-sm px-4',
                          field.state.value === 'high' && 'text-destructive',
                        )}
                      >
                        <SelectValue placeholder={t('todos.form.priorityPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg border-border/50 shadow-2xl backdrop-blur-xl">
                        <SelectItem value="low" className="rounded-lg m-1">
                          {t('todos.form.priorityLow')}
                        </SelectItem>
                        <SelectItem value="medium" className="rounded-lg m-1">
                          {t('todos.form.priorityMedium')}
                        </SelectItem>
                        <SelectItem
                          value="high"
                          className="rounded-lg m-1 font-semibold text-destructive"
                        >
                          {t('todos.form.priorityHigh')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldError
                      errors={field.state.meta.errors.map((e) => {
                        if (typeof e === 'string') return e
                        if (e && typeof e === 'object' && 'message' in e)
                          return String((e as { message: string }).message)
                        return String(e)
                      })}
                    />
                  </Field>
                </m.div>
              )}
            </form.Field>
          </div>

          {/* 7. Complexity, Estimated Time, Actual Time */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <form.Field name="complexity">
              {(field) => (
                <m.div variants={itemVariants}>
                  <Field className="space-y-2">
                    <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5" /> {t('todos.form.complexityLabel')}
                    </FieldLabel>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      value={field.state.value ?? ''}
                      onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                      placeholder={t('todos.form.complexityPlaceholder')}
                      className="h-10 bg-secondary/30 border-transparent hover:border-primary/30 transition-all rounded-lg px-4 text-sm"
                    />
                    <FieldError
                      errors={field.state.meta.errors.map((e) => {
                        if (typeof e === 'string') return e
                        if (e && typeof e === 'object' && 'message' in e)
                          return String((e as { message: string }).message)
                        return String(e)
                      })}
                    />
                  </Field>
                </m.div>
              )}
            </form.Field>

            <form.Field name="estimatedTime">
              {(field) => (
                <m.div variants={itemVariants}>
                  <Field className="space-y-2">
                    <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> {t('todos.form.estimatedTimeLabel')}
                    </FieldLabel>
                    <Input
                      type="number"
                      min={0}
                      value={field.state.value ?? ''}
                      onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                      placeholder={t('todos.form.estimatedTimePlaceholder')}
                      className="h-10 bg-secondary/30 border-transparent hover:border-primary/30 transition-all rounded-lg px-4 text-sm"
                    />
                    <FieldError
                      errors={field.state.meta.errors.map((e) => {
                        if (typeof e === 'string') return e
                        if (e && typeof e === 'object' && 'message' in e)
                          return String((e as { message: string }).message)
                        return String(e)
                      })}
                    />
                  </Field>
                </m.div>
              )}
            </form.Field>

            <form.Field name="actualTime">
              {(field) => (
                <m.div variants={itemVariants}>
                  <Field className="space-y-2">
                    <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" /> {t('todos.form.actualTimeLabel')}
                    </FieldLabel>
                    <Input
                      type="number"
                      min={0}
                      value={field.state.value ?? ''}
                      onChange={(e) => field.handleChange(e.target.valueAsNumber)}
                      placeholder={t('todos.form.actualTimePlaceholder')}
                      className="h-10 bg-secondary/30 border-transparent hover:border-primary/30 transition-all rounded-lg px-4 text-sm"
                    />
                    <FieldError
                      errors={field.state.meta.errors.map((e) => {
                        if (typeof e === 'string') return e
                        if (e && typeof e === 'object' && 'message' in e)
                          return String((e as { message: string }).message)
                        return String(e)
                      })}
                    />
                  </Field>
                </m.div>
              )}
            </form.Field>
          </div>

          {/* 8. Dependencies */}
          <form.Field name="dependencies">
            {(field) => (
              <m.div variants={itemVariants}>
                <Field className="space-y-2">
                  <FieldLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2">
                    <LayoutList className="w-3.5 h-3.5" /> {t('todos.form.dependenciesLabel')}
                  </FieldLabel>
                  <Combobox
                    multiple
                    value={field.state.value || []}
                    onValueChange={(value) => field.handleChange(value)}
                  >
                    <ComboboxChips className="h-auto min-h-10 bg-secondary/30 border-transparent hover:border-primary/30 rounded-lg px-4 py-2 text-sm">
                      {field.state.value?.map((id: string) => {
                        const todo = availableTodos.find((t) => t.id === id)
                        return (
                          <ComboboxChip
                            key={id}
                            onRemove={() => {
                              field.handleChange(
                                field.state.value?.filter((v: string) => v !== id) || [],
                              )
                            }}
                            className="bg-primary/10 text-primary border-primary/20"
                          >
                            {todo?.title || id}
                          </ComboboxChip>
                        )
                      })}
                      <ComboboxChipsInput
                        placeholder={
                          field.state.value?.length ? '' : t('todos.form.dependenciesPlaceholder')
                        }
                        className="bg-transparent text-sm"
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          setRawDepsInput(e.target.value)
                        }
                      />
                      <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                    </ComboboxChips>
                    <ComboboxContent className="rounded-lg border-border/50 shadow-2xl backdrop-blur-xl max-h-60 overflow-y-auto">
                      <ComboboxList>
                        {availableTodos
                          .filter((todo) => todo.id !== defaultValues?.id)
                          .map((todo) => (
                            <ComboboxItem
                              key={todo.id}
                              value={todo.id}
                              className="rounded-lg m-1 flex items-center gap-2"
                            >
                              <Checkbox
                                checked={field.state.value?.includes(todo.id)}
                                className="pointer-events-none"
                              />
                              <div className="flex flex-col">
                                <span className="font-medium">{todo.title}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {todo.status} • {todo.priority}
                                </span>
                              </div>
                            </ComboboxItem>
                          ))}
                        {availableTodos.length === 0 && (
                          <ComboboxEmpty className="p-4 text-center text-sm text-muted-foreground">
                            {t('todos.form.noDependenciesAvailable', 'No tasks available')}
                          </ComboboxEmpty>
                        )}
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
                </Field>
              </m.div>
            )}
          </form.Field>
        </FieldGroup>
      </div>

      <m.div
        variants={itemVariants}
        className="pt-6 border-t border-border/50 mt-auto sticky bottom-0 bg-secondary/30 backdrop-blur-md pb-4 z-10"
      >
        <Field className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="rounded-lg px-6 hover:bg-secondary/50 transition-colors"
          >
            <X className="w-4 h-4 mr-2" />
            {t('common.cancel')}
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="rounded-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all active:scale-95"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('common.loading')}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                {defaultValues?.id ? t('todos.actions.update') : t('todos.actions.create')}
              </div>
            )}
          </Button>
        </Field>
      </m.div>
    </m.form>
  )
}
