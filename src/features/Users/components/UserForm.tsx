import { useForm } from '@tanstack/react-form'
import { Info, RefreshCw, User as UserIcon, Briefcase, Building2 } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
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
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useDepartments } from '@/features/Departments/api/departments.queries'
import {
  useRoles,
  useJobTitles,
  useExperienceLevels,
  useSkills,
  useUsers,
} from '../api/users.queries'
import type { User } from '../model/types'

const createUserSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t('validation.required')),
    email: z.string().email(t('validation.invalidEmail')).min(1, t('validation.required')),
    roleId: z.string().min(1, t('validation.required')),
    avatar: z.string().url(t('validation.invalidUrl')).min(1, t('validation.required')),
    jobTitleId: z.string().nullable(),
    experienceLevelId: z.string().nullable(),
    departmentId: z.string().nullable(),
    reportsTo: z.string().nullable(),
    skills: z.array(z.string()).optional(),
  })

export type UserFormValues = z.infer<ReturnType<typeof createUserSchema>>

type UserFormProps = {
  defaultValues?: Partial<User>
  onSubmit: (values: UserFormValues) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
}

export function UserForm({ defaultValues, onSubmit, onCancel, isLoading }: UserFormProps) {
  const { t } = useTranslation()
  const initialAvatar = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'
  const emptySelectValue = '__none__'
  const userSchema = React.useMemo(() => createUserSchema(t), [t])

  const { data: departments } = useDepartments()
  const { data: users } = useUsers()
  const { data: roles } = useRoles()
  const { data: jobTitles } = useJobTitles()
  const { data: experienceLevels } = useExperienceLevels()
  const { data: availableSkills } = useSkills()

  const form = useForm({
    defaultValues: {
      name: defaultValues?.name ?? '',
      email: defaultValues?.email ?? '',
      roleId: defaultValues?.roleId ?? '',
      avatar: defaultValues?.avatar ?? initialAvatar,
      jobTitleId: defaultValues?.jobTitleId ?? null,
      experienceLevelId: defaultValues?.experienceLevelId ?? null,
      departmentId: defaultValues?.departmentId ?? null,
      reportsTo: defaultValues?.reportsTo ?? null,
      skills: defaultValues?.skills ?? [],
    } as UserFormValues,
    validators: {
      onChange: userSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value)
    },
  })

  return (
    <TooltipProvider>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="space-y-8"
      >
        <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <UserIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold leading-none tracking-tight">
                    {t('users.form.sections.account.title')}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('users.form.sections.account.description')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <form.Field
                    name="avatar"
                    children={(field) => (
                      <Field className="space-y-3">
                        <div className="flex items-center gap-2">
                          <FieldLabel htmlFor={field.name}>
                            {t('users.form.avatarLabel')}
                          </FieldLabel>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>{t('users.form.avatarHelp')}</TooltipContent>
                          </Tooltip>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-xl border border-border/40 bg-muted/5">
                          <Avatar className="h-16 w-16 border-2 border-background shadow-sm ring-1 ring-border/10">
                            <AvatarImage
                              src={field.state.value}
                              alt="Avatar preview"
                              className="object-cover"
                            />
                            <form.Subscribe selector={(state) => state.values.name}>
                              {(name) => (
                                <AvatarFallback className="bg-primary/5 text-primary text-lg font-bold">
                                  {((name as string) || '?').charAt(0).toUpperCase()}
                                </AvatarFallback>
                              )}
                            </form.Subscribe>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex gap-2">
                              <Input
                                id={field.name}
                                value={field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                  field.handleChange(e.target.value)
                                }
                                placeholder={t('users.form.avatarPlaceholder')}
                                className="font-mono text-xs"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="shrink-0"
                                onClick={() =>
                                  field.handleChange(
                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
                                  )
                                }
                                disabled={isLoading}
                                title={t('users.form.avatarRandom')}
                              >
                                <RefreshCw
                                  className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                                />
                              </Button>
                            </div>
                          </div>
                        </div>
                        <FieldError
                          errors={field.state.meta.errors.map((e) => {
                            if (typeof e === 'string') return e
                            if (e && typeof e === 'object' && 'message' in e)
                              return String((e as { message: string }).message)
                            return String(e)
                          })}
                        />
                      </Field>
                    )}
                  />
                </div>

                <form.Field
                  name="name"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>{t('users.form.nameLabel')}</FieldLabel>
                      <Input
                        id={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          field.handleChange(e.target.value)
                        }
                        placeholder={t('users.form.namePlaceholder')}
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
                  )}
                />

                <form.Field
                  name="email"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>{t('users.form.emailLabel')}</FieldLabel>
                      <Input
                        id={field.name}
                        type="email"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                          field.handleChange(e.target.value)
                        }
                        placeholder={t('users.form.emailPlaceholder')}
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
                  )}
                />
              </div>
            </div>

        <Separator className="opacity-50" />

        <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Briefcase className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold leading-none tracking-tight">
                    {t('users.form.sections.professional.title')}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('users.form.sections.professional.description')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <form.Field
                  name="roleId"
                  children={(field) => (
                    <Field>
                      <div className="flex items-center gap-2">
                        <FieldLabel htmlFor={field.name}>{t('users.form.roleLabel')}</FieldLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>{t('users.form.roleHelp')}</TooltipContent>
                        </Tooltip>
                      </div>
                      <Select
                        value={field.state.value || ''}
                        onValueChange={(value: string) => field.handleChange(value)}
                      >
                        <SelectTrigger id={field.name}>
                          <SelectValue placeholder={t('users.form.rolePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          {roles?.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                            </SelectItem>
                          ))}
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
                  )}
                />

                <form.Field
                  name="jobTitleId"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>{t('users.form.jobTitleLabel')}</FieldLabel>
                      <Select
                        value={field.state.value ?? emptySelectValue}
                        onValueChange={(value: string) =>
                          field.handleChange(value === emptySelectValue ? null : value)
                        }
                      >
                        <SelectTrigger id={field.name}>
                          <SelectValue placeholder={t('users.form.jobTitlePlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={emptySelectValue}>-</SelectItem>
                          {jobTitles?.map((jt) => (
                            <SelectItem key={jt.id} value={jt.id}>
                              {jt.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />

                <form.Field
                  name="experienceLevelId"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        {t('users.form.experienceLevelLabel')}
                      </FieldLabel>
                      <Select
                        value={field.state.value ?? emptySelectValue}
                        onValueChange={(value: string) =>
                          field.handleChange(value === emptySelectValue ? null : value)
                        }
                      >
                        <SelectTrigger id={field.name}>
                          <SelectValue placeholder={t('users.form.experienceLevelPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={emptySelectValue}>-</SelectItem>
                          {experienceLevels?.map((el) => (
                            <SelectItem key={el.id} value={el.id}>
                              {el.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
              </div>
            </div>

        <Separator className="opacity-50" />

        <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold leading-none tracking-tight">
                    {t('users.form.sections.organization.title')}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('users.form.sections.organization.description')}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <form.Field
                  name="skills"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>{t('users.form.skillsLabel')}</FieldLabel>
                      <Combobox
                        multiple
                        value={field.state.value || []}
                        onValueChange={(value) => field.handleChange(value)}
                      >
                        <ComboboxChips>
                          {(field.state.value || []).map((skill) => (
                            <ComboboxChip key={skill}>{skill}</ComboboxChip>
                          ))}
                          <ComboboxChipsInput placeholder={t('users.form.skillsPlaceholder')} />
                        </ComboboxChips>
                        <ComboboxContent>
                          <ComboboxEmpty>{t('users.form.skillsEmpty')}</ComboboxEmpty>
                          <ComboboxList>
                            {availableSkills?.map((skill) => (
                              <ComboboxItem key={skill.id} value={skill.name}>
                                {skill.name}
                              </ComboboxItem>
                            ))}
                          </ComboboxList>
                        </ComboboxContent>
                      </Combobox>
                    </Field>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <form.Field
                  name="departmentId"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>
                        {t('users.form.departmentLabel')}
                      </FieldLabel>
                      <Select
                        value={field.state.value ?? emptySelectValue}
                        onValueChange={(value: string) =>
                          field.handleChange(value === emptySelectValue ? null : value)
                        }
                      >
                        <SelectTrigger id={field.name}>
                          <SelectValue placeholder={t('users.form.departmentPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={emptySelectValue}>-</SelectItem>
                          {departments?.map((dept) => (
                            <SelectItem key={dept.id} value={dept.id}>
                              {dept.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />

                <form.Field
                  name="reportsTo"
                  children={(field) => (
                    <Field>
                      <div className="flex items-center gap-2">
                        <FieldLabel htmlFor={field.name}>
                          {t('users.form.reportsToLabel')}
                        </FieldLabel>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>{t('users.form.reportsToHelp')}</TooltipContent>
                        </Tooltip>
                      </div>
                      <Select
                        value={field.state.value ?? emptySelectValue}
                        onValueChange={(value: string) =>
                          field.handleChange(value === emptySelectValue ? null : value)
                        }
                      >
                        <SelectTrigger id={field.name}>
                          <SelectValue placeholder={t('users.form.reportsToPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={emptySelectValue}>-</SelectItem>
                          {users
                            ?.filter((u: User) => u.id !== defaultValues?.id)
                            ?.map((user: User) => (
                              <SelectItem key={user.id} value={user.id}>
                                {user.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />
              </div>
            </div>

        <div className="grid grid-cols-2 gap-3 pt-6 border-t border-border/40">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-xl"
          >
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={isLoading} className="rounded-xl">
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                {t('common.saving')}
              </div>
            ) : defaultValues?.id ? (
              t('common.save')
            ) : (
              t('common.create')
            )}
          </Button>
        </div>
      </form>
    </TooltipProvider>
  )
}
