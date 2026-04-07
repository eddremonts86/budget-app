---
name: toast-confirm-delete
description: 'Usar cuando hay que reemplazar window.confirm() / confirm() con el patrón de toast de confirmación de eliminación aprobado en este proyecto. Cubre el patrón exacto con toast.error + action button, stop-propagation en cards clickeables, EditSheet desde listas, y dónde NO usar el patrón. Obligatorio para cualquier tarea de delete que toque window.confirm.'
---

# Toast Confirm Delete — App Pattern

## Por qué Nunca `window.confirm()`

- Bloquea el hilo principal del navegador
- Rompe la experiencia visual (dialog nativo sin estilos)
- No puede ser testeado en Playwright / jsdom
- Inconsistente con el resto del sistema de notificaciones

---

## Patrón Estándar de Eliminación

El proyecto usa **`toast.error` con un `action` button** como paso de confirmación. El usuario ve el toast durante 10 segundos y puede hacer clic en "Delete" para confirmar.

```tsx
import { toast } from '@/shared/lib/toast'

// En un handler (NO async — el toast maneja la asincronía)
function handleDelete(item: Item) {
  toast.error(t('myModule.confirm.delete'), {
    description: t('common.undoWarning'),
    action: {
      label: t('common.delete'),
      onClick: () => deleteMutation.mutate(item.id),
    },
    duration: 10000,
  })
}
```

### Cuando hay navegación post-delete (ej. detail page → list)

```tsx
function handleDelete() {
  toast.error(t('budgets.actions.deleteConfirm'), {
    description: t('common.undoWarning'),
    action: {
      label: t('common.delete'),
      onClick: () => deleteMutation.mutateAsync(item.id).then(() => window.history.back()),
    },
    duration: 10000,
  })
}
```

---

## Claves i18n Requeridas

En el módulo propietario (`common.json` bajo la sección del módulo):

```json
"actions": {
  "deleteConfirm": "Are you sure you want to delete this item?"
}
```

Claves globales (ya existen, no duplicar):

```json
"common.undoWarning": "This action cannot be undone."
"common.delete": "Delete"
```

---

## Cards Clickeables con Menú de Acciones

Cuando una card es un `<Link>` de TanStack Router y tiene un dropdown de acciones (`···`), se debe evitar que el clic en el dropdown propague la navegación.

### Patrón aprobado

```tsx
<Link to="/dashboard/..." params={...} className="block group mb-4 break-inside-avoid">
  <div className="border rounded-xl p-4 ...">
    {/* Header con nombre + scope badge + actions */}
    <div className="flex items-start justify-between gap-2">
      <div className="flex-1 min-w-0">{/* nombre, descripción */}</div>

      <div className="flex items-center gap-1.5 shrink-0">
        <span className="scope-badge">...</span>

        {/* ⚠️ OBLIGATORIO: detener propagación para no disparar el Link */}
        <div
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-6 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <IconDotsVertical className="size-3.5" />
                <span className="sr-only">{t('common.actions')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditingItem(item)}>
                <IconEdit className="size-4 mr-2" />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => handleDelete(item)}
              >
                <IconTrash className="size-4 mr-2" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
    {/* resto de la card */}
  </div>
</Link>
```

### Estado para EditSheet desde lista

```tsx
const [editingItem, setEditingItem] = React.useState<Item | null>(null)

// Al final del JSX:
{
  editingItem && (
    <EditItemSheet
      open={!!editingItem}
      onOpenChange={(open) => {
        if (!open) setEditingItem(null)
      }}
      item={editingItem}
    />
  )
}
```

---

## Dónde Está Implementado (referencias reales)

| Archivo                                                | Patrón                                               |
| ------------------------------------------------------ | ---------------------------------------------------- |
| `src/modules/categories/components/CategoriesPage.tsx` | Toast confirm en dropdown de tabla                   |
| `src/modules/budgets/components/BudgetDetailPage.tsx`  | Toast confirm con navigate-back post-delete          |
| `src/modules/budgets/components/BudgetsPage.tsx`       | Card con Link + dropdown de acciones + toast confirm |

---

## Anti-Patrones (NUNCA hacer)

```tsx
// ❌ NUNCA
if (window.confirm('¿Estás seguro?')) { ... }
if (!confirm(t('...'))) return

// ❌ NUNCA usar un <AlertDialog> modal si hay un toast disponible
// (reservar AlertDialog solo para acciones irreversibles críticas que deben bloquearse)

// ❌ NUNCA poner onClick directamente en DropdownMenuTrigger para stop-propagation
// (el wrapper div es más fiable con preventDefault + stopPropagation)
```

---

## Checklist de Migración

Cuando migres un `confirm()` existente:

- [ ] Importar `toast` desde `@/shared/lib/toast`
- [ ] Cambiar handler a no-async (el toast es el paso de confirmación)
- [ ] Usar `mutate()` (no `mutateAsync()`) salvo que necesites encadenar `.then()`
- [ ] Añadir `duration: 10000` (10 seg para que el usuario pueda confirmar)
- [ ] Verificar que la clave i18n `confirm.delete` existe en el módulo
- [ ] Verificar que `common.undoWarning` y `common.delete` existen (ya existen globalmente)
- [ ] Buscar otros `window.confirm` en el mismo módulo y migrarlos también
