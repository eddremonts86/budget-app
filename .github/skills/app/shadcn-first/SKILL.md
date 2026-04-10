---
name: shadcn-first
description: Regla cardinal de UI — SIEMPRE usa componentes de shadcn/ui (o los ya existentes en el proyecto) antes de crear cualquier elemento HTML nativo o componente custom. Aplicar cuando se trabajen formularios, inputs, selects, fechas, diálogos, toasts, tablas, botones o cualquier elemento de interfaz. Incluye el catálogo completo de componentes disponibles en este proyecto.
---

# Shadcn-First — Regla Cardinal de UI

## ⚠️ REGLA OBLIGATORIA

> **Antes de escribir CUALQUIER elemento UI, revisa el catálogo de componentes disponibles.**  
> Si existe un componente que cubra tu necesidad (total o parcialmente), **úsalo**. No crees HTML nativo cuando hay un componente.

Orden de prioridad:

1. **Componente propio del proyecto** (`src/components/ui/` o `src/modules/../ui/`) — estos ya siguen las convenciones del proyecto
2. **shadcn/ui** — instalar con `pnpm dlx shadcn@latest add <component>` si no está
3. **Custom** — solo si no existe ninguna opción en los puntos anteriores

---

## Catálogo de Componentes — `src/components/ui/`

| Necesidad               | Componente a usar                      | Import                                |
| ----------------------- | -------------------------------------- | ------------------------------------- |
| Botón                   | `Button`                               | `@/components/ui/button`              |
| Input de texto          | `Input`                                | `@/components/ui/input`               |
| Área de texto           | `Textarea`                             | `@/components/ui/textarea`            |
| Label                   | `Label`                                | `@/components/ui/label`               |
| Select / dropdown       | `Select`, `SelectTrigger`, ...         | `@/components/ui/select`              |
| **Fecha (DatePicker)**  | `DatePicker`                           | `@/components/ui/date-picker`         |
| **Fecha + Hora**        | `Calendar` + Popover custom (TodoForm) | `@/components/ui/calendar`            |
| Checkbox                | `Checkbox`                             | `@/components/ui/checkbox`            |
| Switch / Toggle         | `Switch`                               | `@/components/ui/switch`              |
| Modal / Alert Dialog    | (usar Sheet o Dialog de shadcn)        | instalar: `shadcn add dialog`         |
| Sheet / Panel lateral   | `Sheet` + `CrudSheet*`                 | `@/components/ui/sheet`, `crud-sheet` |
| Buscador / Autocomplete | `Combobox`                             | `@/components/ui/combobox`            |
| Tabs                    | `Tabs`, `TabsList`, ...                | `@/components/ui/tabs`                |
| Cards                   | `Card`, `CardHeader`, ...              | `@/components/ui/card`                |
| Badge                   | `Badge`                                | `@/components/ui/badge`               |
| Avatar                  | `Avatar`                               | `@/components/ui/avatar`              |
| Tooltip                 | `Tooltip`                              | `@/components/ui/tooltip`             |
| Popover                 | `Popover`                              | `@/components/ui/popover`             |
| Dropdown menu           | `DropdownMenu`                         | `@/components/ui/dropdown-menu`       |
| Separador               | `Separator`                            | `@/components/ui/separator`           |
| Skeleton / loading      | `Skeleton`                             | `@/components/ui/skeleton`            |
| Progress bar            | `Progress`                             | `@/components/ui/progress`            |
| Scroll area             | `ScrollArea`                           | `@/components/ui/scroll-area`         |
| Tabla                   | `Table`, `TableRow`, ...               | `@/components/ui/table`               |
| Chart / Gráfica         | `Chart`                                | `@/components/ui/chart`               |
| Toggle / Toggle Group   | `Toggle`, `ToggleGroup`                | `@/components/ui/toggle`              |
| Drawer (mobile)         | `Drawer`                               | `@/components/ui/drawer`              |
| Sidebar                 | `Sidebar`, `SidebarProvider`, ...      | `@/components/ui/sidebar`             |
| Campo de form con error | `Field`, `FieldLabel`, `FieldError`    | `@/components/ui/field`               |
| Breadcrumb              | `Breadcrumb`                           | `@/components/ui/breadcrumb`          |
| Input con ícono / addon | `InputGroup`                           | `@/components/ui/input-group`         |

---

## DatePicker — Uso Correcto

El proyecto tiene `DatePicker` en `@/components/ui/date-picker`. **Nunca usar `<Input type="date">`**.

```tsx
import { DatePicker } from '@/components/ui/date-picker'

// Campo obligatorio
<DatePicker
  value={field.state.value}          // string 'YYYY-MM-DD' o ''
  onChange={field.handleChange}       // (value: string) => void
/>

// Campo opcional (muestra X para limpiar)
<DatePicker
  value={field.state.value ?? ''}
  onChange={(v) => field.handleChange(v)}
  placeholder="No end date"
  optional
/>

// Con fechas deshabilitadas
<DatePicker
  value={startDate}
  onChange={setStartDate}
  disabledDates={(date) => date < new Date()}
/>

// Deshabilitado
<DatePicker value={value} onChange={onChange} disabled />
```

### Props de DatePicker

| Prop            | Tipo                      | Default         | Descripción                          |
| --------------- | ------------------------- | --------------- | ------------------------------------ |
| `value`         | `string`                  | —               | Fecha en formato `YYYY-MM-DD` o `''` |
| `onChange`      | `(value: string) => void` | —               | Callback al seleccionar              |
| `placeholder`   | `string`                  | `'Pick a date'` | Texto cuando no hay fecha            |
| `optional`      | `boolean`                 | `false`         | Muestra botón X para limpiar         |
| `disabledDates` | `(date: Date) => boolean` | —               | Función para deshabilitar fechas     |
| `disabled`      | `boolean`                 | `false`         | Deshabilita el picker                |
| `className`     | `string`                  | —               | Clases adicionales para el trigger   |

---

## Agregar Componentes Nuevos de shadcn

Si necesitas un componente que aún no está en el proyecto:

```bash
# Ver componentes disponibles
pnpm dlx shadcn@latest add --list

# Agregar un componente
pnpm dlx shadcn@latest add dialog
pnpm dlx shadcn@latest add alert
pnpm dlx shadcn@latest add accordion
```

El componente se instalará en `src/components/ui/` siguiendo las convenciones del proyecto.

---

## 🚫 REGLA CRÍTICA — No Modificar `src/components/ui/`

> **NUNCA edites archivos dentro de `src/components/ui/`.**

Estos archivos son gestionados por la CLI de shadcn/ui:

```bash
pnpm dlx shadcn@latest add <component>   # instala / sobreescribe
pnpm dlx shadcn@latest diff              # detecta cambios upstream
```

Cualquier modificación directa **se perderá** en la próxima actualización de la librería.

### ✅ Patrón correcto — crear un wrapper en `src/shared/ui/` o `src/components/composite/`

```tsx
// ❌ MAL — editar directamente src/components/ui/toggle-group.tsx
// (se perderá al actualizar shadcn)

// ✅ BIEN — crear un wrapper que envuelve el componente de shadcn
// src/shared/ui/ToggleSelector.tsx
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export function ToggleSelector({ items, value, onChange }: ToggleSelectorProps) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-muted/30 p-1">
      <ToggleGroup type="single" value={value} onValueChange={...}>
        {/* lógica custom aquí */}
      </ToggleGroup>
    </div>
  )
}
```

### Regla de oro

| Necesidad                          | Acción correcta                                                 |
| ---------------------------------- | --------------------------------------------------------------- |
| Añadir lógica/estilo al componente | Crear wrapper en `src/shared/ui/` o `src/components/composite/` |
| Componente no existe en shadcn     | `pnpm dlx shadcn@latest add <nombre>`                           |
| Bug en el componente de shadcn     | Abrir issue upstream o crear wrapper que lo parchee             |
| Actualizar un componente           | `pnpm dlx shadcn@latest add <nombre>` — nunca editar a mano     |

---

## Anti-Patterns — Lo Que NO Hacer

```tsx
// ❌ MAL — input nativo para fecha
<input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
<Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />

// ✅ BIEN — DatePicker componente
<DatePicker value={date} onChange={setDate} />

// ❌ MAL — Popover + Calendar inline (ya está encapsulado en DatePicker)
<Popover><PopoverTrigger>...<CalendarComponent mode="single" .../></Popover>

// ✅ BIEN — usar DatePicker
<DatePicker value={date} onChange={setDate} />

// ❌ MAL — select nativo
<select value={scope} onChange={(e) => setScope(e.target.value)}>
  <option value="personal">Personal</option>
</select>

// ✅ BIEN — Select de shadcn
<Select value={scope} onValueChange={setScope}>
  <SelectTrigger><SelectValue /></SelectTrigger>
  <SelectContent>
    <SelectItem value="personal">Personal</SelectItem>
  </SelectContent>
</Select>

// ❌ MAL — alert/confirm nativo para confirmaciones
window.confirm('¿Seguro que deseas eliminar?')

// ✅ BIEN — toast de shadcn con acción (ver skill toast-confirm-delete)
toast.error('¿Eliminar?', { action: { label: 'Confirmar', onClick: handleDelete } })
```

---

## Forms — Patrón Completo Correcto

```tsx
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { getFieldError } from '@/shared/lib/utils'

// En cada campo del form
;<form.Field name="startDate">
  {(field) => (
    <Field>
      <FieldLabel>{t('entity.fields.startDate')}</FieldLabel>
      <DatePicker value={field.state.value} onChange={field.handleChange} />
      <FieldError errors={field.state.meta.errors.map(getFieldError)} />
    </Field>
  )}
</form.Field>
```
