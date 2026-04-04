---
name: feature-crud
description: CRUD completo en TanStack Template. Usar cuando se creen o modifiquen operaciones Create/Read/Update/Delete en módulos, sheets de edición/creación, formularios con TanStack Form + Zod, o cuando se necesite seguir el CrudSheet Protocol. Incluye patrones de queries, mutations, shadcn Sheet, i18n y validación.
---

# Feature CRUD Skill

## CrudSheet Protocol (OBLIGATORIO)

Todo sheet de creación/edición **DEBE** usar los componentes de `@/components/ui/crud-sheet`:

```tsx
import { Sheet, SheetTrigger } from '@/components/ui/sheet'
import {
  CrudSheetContent,
  CrudSheetHeader,
  CrudSheetBody,
  CrudSheetSection,
  CrudSheetActions,
} from '@/components/ui/crud-sheet'

export function CreateEntitySheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button>{t('entity.actions.create')}</Button>
      </SheetTrigger>
      <CrudSheetContent>
        <CrudSheetHeader
          title={t('entity.create.title')}
          description={t('entity.create.description')}
          onClose={onClose}
          showPing             {/* ← connectivity indicator, always shown */}
        />
        <CrudSheetBody>
          <CrudSheetSection>
            {/* form fields */}
          </CrudSheetSection>
        </CrudSheetBody>
        <CrudSheetActions>
          <Button variant="outline" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="submit">{t('entity.actions.create')}</Button>
        </CrudSheetActions>
      </CrudSheetContent>
    </Sheet>
  )
}
```

### CrudSheet Component Contracts

| Component          | Required Props     | Notes                                                      |
| ------------------ | ------------------ | ---------------------------------------------------------- |
| `CrudSheetContent` | —                  | Always `showCloseButton={false}`, max-w 560px, blur bg     |
| `CrudSheetHeader`  | `title`, `onClose` | `description?`, `actionsSlot?`, `showPing?` (default true) |
| `CrudSheetBody`    | —                  | flex-1, overflow-y-auto, p-6, space-y-6                    |
| `CrudSheetSection` | —                  | Card-style border container, p-4                           |
| `CrudSheetActions` | —                  | Bottom footer, grid-cols-2 buttons, border-t               |

## TanStack Form + Zod Pattern

```tsx
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { createEntitySchema } from '../model/schema'
import { useCreateEntity } from '../api/entity.queries'

export function EntityForm({ onSuccess }: { onSuccess: () => void }) {
  const { t } = useTranslation()
  const createEntity = useCreateEntity()

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
    },
    validatorAdapter: zodValidator(),
    validators: {
      onChange: createEntitySchema,
    },
    onSubmit: async ({ value }) => {
      await createEntity.mutateAsync(value)
      onSuccess()
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        form.handleSubmit()
      }}
    >
      <form.Field name="name">
        {(field) => (
          <div className="space-y-1.5">
            <Label htmlFor={field.name}>{t('entity.fields.name')}</Label>
            <Input
              id={field.name}
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="text-sm text-destructive">{field.state.meta.errors[0]}</p>
            )}
          </div>
        )}
      </form.Field>
    </form>
  )
}
```

## Data Table Pattern

```tsx
import { useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table'
import type { ColumnDef } from '@tanstack/react-table'

const columns: ColumnDef<Entity>[] = [
  {
    accessorKey: 'name',
    header: () => t('entity.fields.name'),
    cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <IconDots className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit(row.original)}>
            {t('common.edit')}
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={() => onDelete(row.original.id)}>
            {t('common.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]
```

## Delete Confirmation Pattern

Always use AlertDialog for destructive actions:

```tsx
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

function DeleteConfirmDialog({
  entityId,
  open,
  onOpenChange,
}: {
  entityId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const deleteEntity = useDeleteEntity()

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('entity.delete.confirmTitle')}</AlertDialogTitle>
          <AlertDialogDescription>{t('entity.delete.confirmDescription')}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction
            className="bg-destructive text-destructive-foreground"
            onClick={() => deleteEntity.mutate(entityId)}
          >
            {t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

## CRUD Checklist

- [ ] Model: `types.ts` interfaces + `schema.ts` Zod schemas
- [ ] API: `entity.fn.ts` (getAll, getById, create, update, delete)
- [ ] Queries: `entity.queries.ts` with `entityKeys` factory
- [ ] List component with data table or list UI
- [ ] Create sheet following CrudSheet Protocol
- [ ] Edit sheet reusing the same form component
- [ ] Delete with AlertDialog confirmation
- [ ] All labels/messages use i18n keys (no hardcoded strings)
- [ ] Form validation errors displayed inline
- [ ] Mutations show `successMessage` toast via query wrapper
- [ ] `invalidateKeys` set correctly on all mutations

## References

For complete examples: `references/crud-examples.md`
