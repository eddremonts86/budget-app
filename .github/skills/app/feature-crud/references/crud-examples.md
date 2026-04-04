# CRUD Examples — Deep Reference

## Complete Create Sheet Example

```tsx
// src/modules/categories/components/CreateCategorySheet.tsx
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { Sheet, SheetTrigger } from '@/components/ui/sheet'
import {
  CrudSheetContent,
  CrudSheetHeader,
  CrudSheetBody,
  CrudSheetSection,
  CrudSheetActions,
} from '@/components/ui/crud-sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { IconPlus } from '@tabler/icons-react'
import { useCreateCategory } from '../api/categories.queries'
import { createCategorySchema } from '../model/schema'

export function CreateCategorySheet() {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const createCategory = useCreateCategory()

  const form = useForm({
    defaultValues: { name: '', color: '#6366f1' },
    validatorAdapter: zodValidator(),
    validators: { onChange: createCategorySchema },
    onSubmit: async ({ value }) => {
      await createCategory.mutateAsync(value)
      setOpen(false)
      form.reset()
    },
  })

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm">
          <IconPlus className="size-4 mr-2" />
          {t('category.actions.create')}
        </Button>
      </SheetTrigger>
      <CrudSheetContent>
        <CrudSheetHeader
          title={t('category.create.title')}
          description={t('category.create.description')}
          onClose={() => setOpen(false)}
        />
        <form
          onSubmit={(e) => {
            e.preventDefault()
            form.handleSubmit()
          }}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <CrudSheetBody>
            <CrudSheetSection>
              <form.Field name="name">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="name">{t('category.fields.name')}</Label>
                    <Input
                      id="name"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      placeholder={t('category.fields.namePlaceholder')}
                    />
                    {field.state.meta.errors.map((err) => (
                      <p key={err?.toString()} className="text-sm text-destructive">
                        {err?.toString()}
                      </p>
                    ))}
                  </div>
                )}
              </form.Field>
              <form.Field name="color">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="color">{t('category.fields.color')}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        id="color"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        className="h-9 w-16 p-1 cursor-pointer"
                      />
                      <span className="text-sm text-muted-foreground font-mono">
                        {field.state.value}
                      </span>
                    </div>
                  </div>
                )}
              </form.Field>
            </CrudSheetSection>
          </CrudSheetBody>
          <CrudSheetActions>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={createCategory.isPending}>
              {createCategory.isPending ? t('common.saving') : t('category.actions.create')}
            </Button>
          </CrudSheetActions>
        </form>
      </CrudSheetContent>
    </Sheet>
  )
}
```

## Edit Sheet with Pre-populated Data

```tsx
// EditCategorySheet — receives existing entity, pre-fills form
export function EditCategorySheet({
  category,
  open,
  onOpenChange,
}: {
  category: Category
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const updateCategory = useUpdateCategory()

  const form = useForm({
    defaultValues: {
      id: category.id,
      name: category.name,
      color: category.color ?? '#6366f1',
    },
    validatorAdapter: zodValidator(),
    validators: { onChange: updateCategorySchema },
    onSubmit: async ({ value }) => {
      await updateCategory.mutateAsync(value)
      onOpenChange(false)
    },
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <CrudSheetContent>
        <CrudSheetHeader
          title={t('category.edit.title')}
          description={category.name}
          onClose={() => onOpenChange(false)}
        />
        {/* Same form structure as Create */}
      </CrudSheetContent>
    </Sheet>
  )
}
```

## Paginated List with Filters

```tsx
export function EntityListPage() {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string | undefined>()
  const [editTarget, setEditTarget] = useState<Entity | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const { data: entities, isLoading } = useEntities({ search, status })

  if (isLoading) return <EntityListSkeleton />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder={t('entity.list.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <CreateEntitySheet />
      </div>
      <DataTable
        columns={columns}
        data={entities ?? []}
        onEdit={setEditTarget}
        onDelete={(id) => setDeleteId(id)}
      />
      {editTarget && (
        <EditEntitySheet
          entity={editTarget}
          open={Boolean(editTarget)}
          onOpenChange={(open) => !open && setEditTarget(null)}
        />
      )}
      <DeleteConfirmDialog
        entityId={deleteId ?? ''}
        open={Boolean(deleteId)}
        onOpenChange={(open) => !open && setDeleteId(null)}
      />
    </div>
  )
}
```

## Zod Schema with i18n Error Keys

```ts
// model/schema.ts
import { z } from 'zod'

export const createCategorySchema = z.object({
  name: z.string().min(1, 'category.errors.nameRequired').max(100, 'category.errors.nameTooLong'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'category.errors.invalidColor')
    .default('#6366f1'),
})

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().uuid(),
})

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>
```

## Query Keys Factory Pattern

```ts
// api/categories.queries.ts
export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (filters?: { search?: string }) => [...categoryKeys.lists(), filters] as const,
  details: () => [...categoryKeys.all, 'detail'] as const,
  detail: (id: string) => [...categoryKeys.details(), id] as const,
}

// Always invalidate the list after mutations:
export function useCreateCategory() {
  return useTQMutation(['categories', 'create'], categoriesApi.create, {
    invalidateKeys: [categoryKeys.lists()],
    successMessage: 'category.messages.created',
  })
}

export function useUpdateCategory() {
  return useTQMutation(['categories', 'update'], categoriesApi.update, {
    invalidateKeys: [categoryKeys.lists()],
    successMessage: 'category.messages.updated',
  })
}

export function useDeleteCategory() {
  return useTQMutation(['categories', 'delete'], categoriesApi.delete, {
    invalidateKeys: [categoryKeys.lists()],
    successMessage: 'category.messages.deleted',
  })
}
```
