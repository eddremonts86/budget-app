import { useForm } from '@tanstack/react-form'
import { useStore } from '@tanstack/react-store'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProjects } from '@/modules/projects/api/projects.queries'
import { getFieldError } from '@/shared/lib/utils'
import { createBudgetSchema, updateBudgetSchema } from '../model/schema'
import type { Budget } from '../model/types'

interface BudgetFormProps {
  defaultValues?: Partial<Budget>
  onSubmit: (values: Record<string, unknown>) => Promise<void>
  isSubmitting?: boolean
  mode?: 'create' | 'edit'
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'DKK', 'MXN', 'COP', 'ARS']

export function BudgetForm({
  defaultValues,
  onSubmit,
  isSubmitting,
  mode = 'create',
}: BudgetFormProps) {
  const { t } = useTranslation()
  const { data: projects = [] } = useProjects()

  const schema = mode === 'create' ? createBudgetSchema : updateBudgetSchema

  const form = useForm({
    defaultValues: {
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      scope: defaultValues?.scope ?? 'personal',
      projectId: defaultValues?.projectId ?? null,
      departmentId: defaultValues?.departmentId ?? null,
      targetAmount: defaultValues?.targetAmount ?? null,
      currency: defaultValues?.currency ?? 'USD',
      periodType: defaultValues?.periodType ?? 'monthly',
      startDate: defaultValues?.startDate
        ? defaultValues.startDate.split('T')[0]
        : new Date().toISOString().split('T')[0],
      endDate: defaultValues?.endDate ? defaultValues.endDate.split('T')[0] : '',
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    validators: { onChange: schema as any },
    onSubmit: async ({ value }) => {
      await onSubmit({
        ...value,
        targetAmount: value.targetAmount !== null ? Number(value.targetAmount) : null,
        endDate: value.endDate || null,
        description: value.description || null,
      })
    },
  })

  const scope = useStore(form.store, (s) => s.values.scope)

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      {/* Name */}
      <form.Field name="name">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name}>{t('budgets.fields.name')} *</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder={t('budgets.fields.namePlaceholder')}
            />
            {field.state.meta.errors[0] !== null && (
              <p className="text-xs text-destructive">
                {getFieldError(field.state.meta.errors[0])}
              </p>
            )}
          </div>
        )}
      </form.Field>

      {/* Description */}
      <form.Field name="description">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name}>{t('budgets.fields.description')}</Label>
            <Input
              id={field.name}
              value={field.state.value ?? ''}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              placeholder={t('budgets.fields.descriptionPlaceholder')}
            />
          </div>
        )}
      </form.Field>

      {/* Scope + Period */}
      <div className="grid grid-cols-2 gap-3">
        <form.Field name="scope">
          {(field) => (
            <div className="space-y-1.5">
              <Label>{t('budgets.fields.scope')} *</Label>
              <Select
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v as typeof field.state.value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">{t('budgets.scopes.personal')}</SelectItem>
                  <SelectItem value="project">{t('budgets.scopes.project')}</SelectItem>
                  <SelectItem value="department">{t('budgets.scopes.department')}</SelectItem>
                  <SelectItem value="company">{t('budgets.scopes.company')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>

        <form.Field name="periodType">
          {(field) => (
            <div className="space-y-1.5">
              <Label>{t('budgets.fields.periodType')} *</Label>
              <Select
                value={field.state.value}
                onValueChange={(v) => field.handleChange(v as typeof field.state.value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">{t('budgets.periods.monthly')}</SelectItem>
                  <SelectItem value="quarterly">{t('budgets.periods.quarterly')}</SelectItem>
                  <SelectItem value="semiannual">{t('budgets.periods.semiannual')}</SelectItem>
                  <SelectItem value="annual">{t('budgets.periods.annual')}</SelectItem>
                  <SelectItem value="one_time">{t('budgets.periods.oneTime')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>
      </div>

      {/* Project select (conditional) */}
      {scope === 'project' && (
        <form.Field name="projectId">
          {(field) => (
            <div className="space-y-1.5">
              <Label>{t('budgets.fields.project')} *</Label>
              <Select
                value={field.state.value ?? ''}
                onValueChange={(v) => field.handleChange(v || null)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('budgets.fields.selectProject')} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>
      )}

      {/* Target + Currency */}
      <div className="grid grid-cols-2 gap-3">
        <form.Field name="targetAmount">
          {(field) => (
            <div className="space-y-1.5">
              <Label htmlFor={field.name}>{t('budgets.fields.targetAmount')}</Label>
              <Input
                id={field.name}
                type="number"
                min={0}
                step={0.01}
                value={
                  field.state.value !== null && field.state.value !== undefined
                    ? Number(field.state.value) / 100
                    : ''
                }
                onChange={(e) =>
                  field.handleChange(
                    e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null,
                  )
                }
                placeholder={t('budgets.fields.noLimit')}
              />
            </div>
          )}
        </form.Field>

        <form.Field name="currency">
          {(field) => (
            <div className="space-y-1.5">
              <Label>{t('budgets.fields.currency')}</Label>
              <Select value={field.state.value} onValueChange={(v) => field.handleChange(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </form.Field>
      </div>

      {/* Start + End Date */}
      <div className="grid grid-cols-2 gap-3">
        <form.Field name="startDate">
          {(field) => (
            <div className="space-y-1.5">
              <Label htmlFor={field.name}>{t('budgets.fields.startDate')} *</Label>
              <DatePicker value={field.state.value} onChange={field.handleChange} />
            </div>
          )}
        </form.Field>

        <form.Field name="endDate">
          {(field) => (
            <div className="space-y-1.5">
              <Label htmlFor={field.name}>{t('budgets.fields.endDate')}</Label>
              <DatePicker
                value={field.state.value ?? ''}
                onChange={(v) => field.handleChange(v)}
                placeholder={t('budgets.fields.endDatePlaceholder', 'No end date')}
                optional
              />
            </div>
          )}
        </form.Field>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting
          ? t('common.saving')
          : mode === 'create'
            ? t('budgets.actions.create')
            : t('budgets.actions.save')}
      </Button>
    </form>
  )
}
