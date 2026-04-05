---
name: widget-system
description: 'Sistema de widgets del dashboard. Usar cuando se cree, modifique o depure un widget en cualquier módulo: definición en manifest.ts, componente React responsivo con container queries, server function + TanStack Query hook, i18n, y registro en el sistema. Cubre todos los tamaños (4/6/8/12 columnas), refresh, lazy loading con Suspense, y validación MCP. Obligatorio para cualquier tarea que toque WidgetGrid, WidgetRenderer, WidgetDefinition o la property widgets[] de un AppModuleManifest.'
---

# Widget System Skill

## Arquitectura General

El sistema de widgets es un subsistema del kernel `src/modules/core/widget/`. Cualquier módulo puede registrar widgets en su `manifest.ts` y aparecerán automáticamente en el `WidgetGrid` del dashboard.

```
src/modules/core/widget/
├── index.ts                     ← barrel público (importar siempre desde aquí)
├── components/
│   ├── WidgetGrid.tsx           ← grid masonry 12-col, DnD, masonry-item
│   ├── WidgetRenderer.tsx       ← lazy(component) + Suspense
│   ├── SortableWidgetItem.tsx   ← @container, resize, drag handle
│   ├── WidgetControls.tsx       ← WidgetRefreshButton + WidgetRefreshingIndicator
│   └── WidgetConfigurator.tsx   ← popover toggle de visibilidad
├── config/
│   ├── widget-config.ts         ← useSyncExternalStore + localStorage 'widget-config'
│   └── widget-edit-mode.tsx     ← WidgetEditModeProvider + useWidgetEditMode
└── registry/
    └── widget-registry.ts       ← getRegisteredWidgets() + getWidgetById()
```

### Flujo de datos

```
AppModuleManifest.widgets[]
        ↓
getEnabledModules() → getRegisteredWidgets()
        ↓
useWidgetConfig() → EnrichedWidget[] (visible, order, colSpan, rowSpan)
        ↓
WidgetGrid → SortableWidgetItem[@container] → WidgetRenderer → lazy(component)
```

---

## 1. WidgetDefinition — Contrato de Tipo

```ts
// src/modules/core/types.ts
export type WidgetSize = 'sm' | 'md' | 'lg' | 'full'
// sm=4col, md=6col, lg=8col, full=12col (valores por defecto de colSpan)

export interface WidgetDefinition {
  id: string // slug único dentro del módulo, kebab-case
  moduleId?: string // rellenado automáticamente por el registry
  titleKey: string // clave i18n ej. 'dashboard.widgets.myWidget'
  fallbackTitle: string // título en inglés si falta la traducción
  descriptionKey?: string // clave i18n para descripción en configurador
  fallbackDescription?: string // descripción en inglés
  component: () => Promise<{ default: ComponentType }> // lazy loader
  defaultVisible?: boolean // true si se omite
  defaultOrder?: number // número menor = antes; ej. 10, 20, 30, 40
  size?: WidgetSize // determina colSpan inicial
}
```

**qualifiedId** = `${moduleId}:${widgetId}` — es el ID global del widget (ej. `analytics:workload`).

---

## 2. Registro en manifest.ts

Añadir la propiedad `widgets[]` al manifest del módulo propietario:

```ts
// src/modules/<modulo>/manifest.ts
import type { AppModuleManifest } from '@/modules/core/types'

export const myModule: AppModuleManifest = {
  id: 'my-module',
  // ... routes, navigation, etc.
  widgets: [
    {
      id: 'my-widget', // ← kebab-case, único en el módulo
      titleKey: 'dashboard.widgets.myWidget',
      fallbackTitle: 'My Widget',
      fallbackDescription: 'Short description for the configurator',
      defaultVisible: true,
      defaultOrder: 50, // ajustar para posicionar en el grid
      size: 'md', // 'sm'=4col 'md'=6col 'lg'=8col 'full'=12col
      component: () => import('./components/MyWidget').then((m) => ({ default: m.MyWidget })),
    },
  ],
}
```

**Reglas:**

- El módulo DEBE estar registrado en `src/modules/core/registry.ts` para que sus widgets sean visibles.
- Los widgets de un módulo aparecen en el grid GLOBAL (no filtrado por módulo), a menos que `WidgetGrid` reciba `moduleId`.
- No crear widgets en `src/modules/dashboard/` salvo que la lógica pertenezca 100% al dashboard.

---

## 3. Estructura de Archivos por Widget

**Widget simple (sin chart, sin lazy-split):**

```
src/modules/<modulo>/components/
└── MyWidget.tsx          ← componente completo, exporta MyWidget
```

**Widget con chart pesado (lazy split para evitar bundle bloat):**

```
src/modules/<modulo>/components/
├── MyWidget.tsx          ← shell: datos, header, controles, Suspense
└── MyWidgetContent.tsx   ← chart/tabla pesada, importado con React.lazy
```

---

## 4. Plantilla de Componente Widget

### 4.1 Widget Simple

```tsx
// src/modules/<modulo>/components/MyWidget.tsx
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@/components/ui'
import { useTranslation } from 'react-i18next'
import { WidgetRefreshButton, WidgetRefreshingIndicator } from '@/modules/core/widget'
import { useMyData } from '../api/my.queries'

export function MyWidget() {
  const { t } = useTranslation()
  const { data, isLoading, isFetching, refetch } = useMyData()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-4 w-1/2 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 @md:flex-row @md:items-center @md:justify-between">
        <div className="min-w-0">
          <CardTitle>{t('dashboard.widgets.myWidget', 'My Widget')}</CardTitle>
          <CardDescription>{t('dashboard.widgets.myWidgetDesc', 'Description')}</CardDescription>
          {isFetching ? (
            <div className="mt-1">
              <WidgetRefreshingIndicator />
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {/* controles opcionales aquí */}
          <WidgetRefreshButton
            isRefreshing={isFetching}
            onRefresh={() => {
              void refetch()
            }}
            label={t('dashboard.actions.refreshMyWidget', 'Refresh')}
          />
        </div>
      </CardHeader>
      <CardContent>{/* contenido del widget */}</CardContent>
    </Card>
  )
}
```

### 4.2 Widget con Chart Pesado (lazy split)

```tsx
// src/modules/<modulo>/components/MyWidget.tsx
import * as React from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Skeleton,
} from '@/components/ui'
import { useTranslation } from 'react-i18next'
import { WidgetRefreshButton, WidgetRefreshingIndicator } from '@/modules/core/widget'
import { useMyData } from '../api/my.queries'

// Importación lazy del chart pesado
const LazyMyChartContent = React.lazy(() =>
  import('./MyWidgetContent').then((m) => ({ default: m.MyChartContent })),
)

export function MyWidget() {
  const { t } = useTranslation()
  const { data, isLoading, isFetching, refetch } = useMyData()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/3" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-62.5 w-full" />
        </CardContent>
      </Card>
    )
  }

  // transformar data para el chart
  const chartData = (data ?? []).map((item) => ({
    /* ... */
  }))

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 @xl:flex-row @xl:items-start @xl:justify-between">
        <div className="min-w-0">
          <CardTitle>{t('dashboard.widgets.myWidget', 'My Widget')}</CardTitle>
          <CardDescription>{t('dashboard.widgets.myWidgetDesc', 'Description')}</CardDescription>
          {isFetching ? (
            <div className="mt-1">
              <WidgetRefreshingIndicator />
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <WidgetRefreshButton
            isRefreshing={isFetching}
            onRefresh={() => {
              void refetch()
            }}
            label={t('dashboard.actions.refreshMyWidget', 'Refresh my widget')}
          />
        </div>
      </CardHeader>
      <CardContent>
        <React.Suspense fallback={<Skeleton className="h-62.5 w-full" />}>
          <LazyMyChartContent data={chartData} />
        </React.Suspense>
      </CardContent>
    </Card>
  )
}
```

```tsx
// src/modules/<modulo>/components/MyWidgetContent.tsx
// En este archivo van las importaciones pesadas (recharts, etc.)
import { BarChart, Bar, XAxis, YAxis } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'

interface MyChartContentProps {
  data: Array<{ name: string; value: number }>
}

export function MyChartContent({ data }: MyChartContentProps) {
  const chartConfig = { value: { label: 'Value', color: '#3b82f6' } } satisfies ChartConfig
  return (
    <ChartContainer config={chartConfig} className="h-62.5 w-full">
      <BarChart data={data}>
        <XAxis dataKey="name" tickLine={false} axisLine={false} />
        <YAxis hide />
        <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
        <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  )
}
```

---

## 5. Reglas de Diseño Responsivo (CRÍTICO)

El `SortableWidgetItem` tiene `@container` en su div raíz. Esto es el contenedor de referencia para todos los breakpoints internos del widget.

### Breakpoints de container disponibles (Tailwind v4)

| Clase       | Ancho mínimo del contenedor |
| ----------- | --------------------------- |
| `@sm:`      | 24rem (384px)               |
| `@md:`      | 28rem (448px)               |
| `@lg:`      | 32rem (512px)               |
| `@xl:`      | 36rem (576px)               |
| `@2xl:`     | 42rem (672px)               |
| `@[N rem]:` | Arbitrario, ej. `@[53rem]:` |

### Anchos reales de widget por colSpan (desktop, sidebar visible ≈ 150px)

| colSpan | Ancho aprox. |
| ------- | ------------ |
| 4/12    | ~455px       |
| 6/12    | ~692px       |
| 8/12    | ~928px       |
| 12/12   | ~1390px      |

### Reglas de layout obligatorias

```tsx
// ✅ CORRECTO: container queries (se adaptan al widget, no al viewport)
<div className="flex flex-col gap-3 @md:flex-row @md:items-center @md:justify-between">
<div className="grid grid-cols-2 @[53rem]:grid-cols-4">
<div className="grid gap-2 @sm:grid-cols-[1fr_1fr_auto]">

// ❌ INCORRECTO: media queries de viewport (rompen a colSpan estrecho)
<div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
<div className="grid md:grid-cols-2 lg:grid-cols-4">
<div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
```

### Patrones de header por tipo de widget

**Widget de métricas (header con total a la derecha):**

```tsx
<CardHeader className="flex flex-col gap-3 @md:flex-row @md:items-center @md:justify-between">
  <div className="min-w-0">
    <CardTitle>...</CardTitle>
    <CardDescription>...</CardDescription>
    {isFetching ? <div className="mt-1"><WidgetRefreshingIndicator /></div> : null}
  </div>
  <div className="flex items-center gap-2 shrink-0">
    <div className="text-right">
      <div className="text-2xl font-bold">{total}</div>
      <div className="text-xs text-muted-foreground">Label</div>
    </div>
    <WidgetRefreshButton ... />
  </div>
</CardHeader>
```

**Widget con filtros (filtros debajo en estrecho, al lado en ancho):**

```tsx
<CardHeader>
  <div className="flex flex-col gap-4 @xl:flex-row @xl:items-start @xl:justify-between">
    <div className="min-w-0">
      <CardTitle>...</CardTitle>
      <CardDescription>...</CardDescription>
      {isFetching ? <div className="mt-1"><WidgetRefreshingIndicator /></div> : null}
    </div>
    <div className="flex flex-col gap-2">
      <div className="grid gap-2 @sm:grid-cols-[1fr_1fr_auto]">
        {/* filtros Select */}
        <WidgetRefreshButton ... />
      </div>
    </div>
  </div>
</CardHeader>
```

**Widget de lista (header simple con controles):**

```tsx
<CardHeader className="flex flex-col gap-3 @md:flex-row @md:items-start @md:justify-between space-y-0 pb-2">
  <div className="space-y-1">
    <CardTitle>...</CardTitle>
    <CardDescription>...</CardDescription>
    {isFetching ? <div className="mt-1"><WidgetRefreshingIndicator /></div> : null}
  </div>
  <div className="flex items-center gap-2 shrink-0">
    {/* badges o filtros compactos */}
    <WidgetRefreshButton ... />
  </div>
</CardHeader>
```

**Grid de cards 2×N → 4×N:**

```tsx
// ⚠️ Usar @[53rem] para que 4-col siga siendo 2×N en colSpan estrecho
<div className="grid gap-4 grid-cols-2 @[53rem]:grid-cols-4">{/* cards */}</div>
```

---

## 6. Server Function + Query Hook

### Server Function (`api/*.fn.ts`)

```ts
// src/modules/<modulo>/api/<modulo>.fn.ts
import { createServerFn } from '@tanstack/react-start'
import { db } from '@/modules/core/db'

export const getMyWidgetDataFn = createServerFn({ method: 'GET' })
  .validator((input: { filters?: Record<string, unknown> }) => input)
  .handler(async ({ data }) => {
    // query a la DB
    return db.query.myTable.findMany({
      /* ... */
    })
  })
```

### Query Hook (`api/*.queries.ts`)

```ts
// src/modules/<modulo>/api/<modulo>.queries.ts
import { useQuery } from '@tanstack/react-query'
import { getMyWidgetDataFn } from './<modulo>.fn'

export const myWidgetKeys = {
  all: () => ['my-module', 'my-widget'] as const,
  filtered: (filters: Record<string, unknown>) => [...myWidgetKeys.all(), filters] as const,
}

export function useMyWidgetData(filters?: Record<string, unknown>) {
  return useQuery({
    queryKey: myWidgetKeys.filtered(filters ?? {}),
    queryFn: () => getMyWidgetDataFn({ data: { filters } }),
    staleTime: 5 * 60 * 1000, // 5 min estándar para datos analíticos
  })
}
```

---

## 7. Traducciones i18n

Añadir claves en los tres idiomas. Las claves de widgets siguen el patrón `dashboard.widgets.*`:

```json
// src/locales/en/dashboard.json (y es/ y dk/)
{
  "widgets": {
    "myWidget": "My Widget",
    "myWidgetDesc": "Short description shown in the configurator"
  },
  "actions": {
    "refreshMyWidget": "Refresh my widget"
  }
}
```

También añadir en el widget `titleKey` y `fallbackTitle` para el configurador de visibilidad.

---

## 8. WidgetRefreshButton y WidgetRefreshingIndicator

Siempre importados de `@/modules/core/widget`:

```tsx
import { WidgetRefreshButton, WidgetRefreshingIndicator } from '@/modules/core/widget'

// Indicator: aparece en el header mientras isFetching=true
{
  isFetching ? (
    <div className="mt-1">
      <WidgetRefreshingIndicator />
    </div>
  ) : null
}

// Button: siempre visible en el header, deshabilitado mientras refresca
;<WidgetRefreshButton
  isRefreshing={isFetching}
  onRefresh={() => {
    void refetch()
  }}
  label={t('dashboard.actions.refreshX', 'Refresh X')}
/>
```

---

## 9. Skeleton de Carga

```tsx
// Loading state: siempre retornar un skeleton de tamaño similar al widget
if (isLoading) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-1/2 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-62.5 w-full" /> {/* ajustar altura al contenido */}
      </CardContent>
    </Card>
  )
}
```

---

## 10. Configuración de Visibilidad y Tamaño

Los usuarios pueden:

- **Toggle**: mostrar/ocultar desde `WidgetConfigurator`
- **Mover**: arrastrar (drag-and-drop) en modo edición
- **Redimensionar ancho**: ciclar 4→6→8→12 columnas con el botón de edición
- **Redimensionar alto**: drag del handle inferior en modo edición

La configuración persiste en `localStorage` bajo la clave `widget-config`:

```json
{
  "analytics:workload": { "visible": true, "order": 20, "colSpan": 6, "rowSpan": null }
}
```

`defaultOrder` en el manifiesto determina el orden inicial. Valores recomendados:

- `10`: stats-cards (siempre primero)
- `20`: chart principal
- `30`: chart secundario
- `40`: lista / tabla
- `50+`: widgets adicionales de módulos externos

---

## 11. Tamaños Predeterminados por `WidgetSize`

| `size` | `colSpan` por defecto | Breakpoint 4col real |
| ------ | --------------------- | -------------------- |
| `sm`   | 4                     | ~455px               |
| `md`   | 6                     | ~692px               |
| `lg`   | 8                     | ~928px               |
| `full` | 12                    | ~1390px              |

Para widgets de lista/tabla que necesiten todo el ancho: usar `size: 'full'`.
Para widgets de chart: usar `size: 'md'` (6-col) o `size: 'lg'` (8-col).
Para widgets de KPI simple: usar `size: 'sm'` (4-col).

---

## 12. Mostrar el Grid en una Página

### Dashboard principal (todos los widgets)

```tsx
import {
  WidgetGrid,
  WidgetConfigurator,
  WidgetEditModeProvider,
  useWidgetEditMode,
} from '@/modules/core/widget'

export function MyPage() {
  return (
    <WidgetEditModeProvider>
      <div className="flex flex-col h-full gap-8 overflow-y-auto">
        <DashboardToolbar />
        <WidgetGrid /> {/* sin moduleId = todos los módulos */}
      </div>
    </WidgetEditModeProvider>
  )
}
```

### Solo widgets de un módulo específico

```tsx
<WidgetGrid moduleId="analytics" />    {/* filtra por moduleId */}
<WidgetConfigurator moduleId="analytics" />
```

### Toolbar de edición (patrón estándar)

```tsx
function DashboardToolbar() {
  const { editing, toggleEditing } = useWidgetEditMode()
  return (
    <div className="flex items-center justify-end gap-2 shrink-0">
      {editing ? <WidgetConfigurator /> : null}
      <button
        type="button"
        onClick={toggleEditing}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors',
          editing
            ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
            : 'border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        {editing ? <IconCheck className="h-4 w-4" /> : <IconPencil className="h-4 w-4" />}
        {editing ? 'Done' : 'Customize'}
      </button>
    </div>
  )
}
```

---

## 13. Checklist de Creación de Widget

Antes de marcar la tarea como completa, validar cada punto:

### Definición

- [ ] `id` en kebab-case, único dentro del módulo
- [ ] `titleKey` y `fallbackTitle` rellenados
- [ ] `fallbackDescription` rellenado (aparece en el configurador)
- [ ] `defaultOrder` asignado (no conflictivo con otros widgets del mismo módulo)
- [ ] `size` apropiado para el contenido
- [ ] `component` apunta al archivo correcto y exporta el nombre correcto

### Componente

- [ ] Ningún `lg:`, `md:`, `sm:` de viewport — solo `@sm:`, `@md:`, `@xl:`, `@2xl:`, `@[Nrem]:`
- [ ] Header usa container queries para layout flex
- [ ] Skeleton con altura aproximada al contenido real
- [ ] `WidgetRefreshButton` presente en el header
- [ ] `WidgetRefreshingIndicator` condicional en `isFetching`
- [ ] Estado vacío manejado (si aplica)
- [ ] Imports de controles: `from '@/modules/core/widget'`
- [ ] Nada de `col-span-N` hardcodeado en el Card raíz

### Registro

- [ ] Widget añadido a `manifest.ts` del módulo correcto
- [ ] Módulo en `src/modules/core/registry.ts`

### i18n

- [ ] Claves añadidas en `en/`, `es/`, `dk/` con valores reales (no placeholder)

### Validación MCP (OBLIGATORIO)

- [ ] Navegar a `/dashboard`
- [ ] Screenshot con 4-col (localStorage `widget-config` con `colSpan: 4`)
- [ ] Screenshot con 6-col (`colSpan: 6`)
- [ ] Screenshot con 12-col (`colSpan: 12`)
- [ ] Sin errores en consola del browser
- [ ] Restaurar `localStorage.removeItem('widget-config')`

---

## 14. Anti-patterns (NO HACER)

```tsx
// ❌ Media queries de viewport dentro de un widget
<div className="lg:flex-row">...</div>

// ❌ col-span hardcodeado en el Card raíz (el SortableWidgetItem ya gestiona el span)
<Card className="col-span-4">...</Card>
<Card className="col-span-7">...</Card>

// ❌ Importar controles fuera de core/widget
import { WidgetRefreshButton } from './WidgetControls'     // ❌
import { WidgetRefreshButton } from '@/modules/core/widget' // ✅

// ❌ Widget sin skeleton de carga
export function MyWidget() {
  const { data } = useMyData()
  if (!data) return null  // ❌ nunca null en carga, siempre un skeleton
}

// ❌ Datos de otro módulo importados directamente
import { useProjects } from '../../projects/api/projects.queries' // ❌
import { useProjects } from '@/modules/projects'                   // ✅ (barrel público)

// ❌ Lógica de negocio en el manifest
component: async () => {
  const data = await fetch(...)  // ❌ NUNCA en el loader del component
  return { default: MyWidget }
}
```

---

## 15. Módulos Existentes y sus Widgets

| qualifiedId                      | Módulo    | Size | Order |
| -------------------------------- | --------- | ---- | ----- |
| `dashboard:stats-cards`          | dashboard | full | 10    |
| `analytics:workload`             | analytics | md   | 20    |
| `analytics:expense-distribution` | analytics | md   | 30    |
| `tasks:upcoming-todos`           | tasks     | full | 40    |

Nuevos widgets deben usar `defaultOrder >= 50` para no interferir con los existentes,
o usar valores intermedios (ej. 15, 25) si deben insertarse entre los existentes.
